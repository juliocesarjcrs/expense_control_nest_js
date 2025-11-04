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

  it('/files/load (GET) return string  iamge path', () => {
    return request(app.getHttpServer())
      .get('/files/load?file=uploads/users/89axxx')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(expect.any(String));
      });
  });
});
