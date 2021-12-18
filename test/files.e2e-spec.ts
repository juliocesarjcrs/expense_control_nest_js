import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Connection } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/entities/user.entity';
import { userSaved } from './utils/data';

import {
  loadFixtures as loadFixturesBase,
  // tokenForUser as tokenForUserBase,
} from './utils/utils';
let app: INestApplication;
let mod: TestingModule;
let connection: Connection;

const loadFixtures = async (sqlFileName: string) =>
  loadFixturesBase(connection, sqlFileName);
const passwordUser2 = '123';

const newUser = {
  name: 'julio',
  email: 'user3@correo.com',
  password: passwordUser2,
};
const objChangePassword = {
  currentlyPassword: passwordUser2,
  password: '1234',
  passwordComfirm: '1234',
};
export const tokenForUser = (user: Partial<User> = userSaved): string => {
  const res = app.get(AuthService).getTokenForUser(user as User);
  return res;
};

describe('FilesController (e2e)', () => {
  beforeAll(async () => {
    mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    connection = app.get(Connection);
    await loadFixtures('1-users.sql');
  });

  afterAll(async () => await app.close());

  it('/files//load (GET) validation error File not found', () => {
    return request(app.getHttpServer())
      .get('/files/load?file=uploads/users/89axxx')
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            message: 'File not found',
          }),
        );
      });
  });
});
