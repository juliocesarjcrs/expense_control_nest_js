import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Connection } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { userSaved } from './utils/data';
import { User } from 'src/users/entities/user.entity';
import { loadFixtures as loadFixturesBase } from './utils/utils';

let app: INestApplication;
let mod: TestingModule;
let connection: Connection;

const loadFixtures = async (sqlFileName: string) =>
  loadFixturesBase(connection, sqlFileName);

export const tokenForUser = (user: Partial<User> = userSaved): string => {
  return app.get(AuthService).getTokenForUser(user as User);
};

describe('ExensesController (e2e)', () => {
  beforeAll(async () => {
    mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = mod.createNestApplication();
    await app.init();

    connection = app.get(Connection);
    await loadFixtures('1-users.sql');
  });

  afterAll(async () => app.close());

  it('/expenses (GET)', () => {
    return request(app.getHttpServer())
      .get('/expenses')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        expect(response.body.data.length).toBe(0);
        expect(response.body).toEqual(
          expect.objectContaining({
            graph: expect.any(Array),
            labels: expect.any(Array),
            data: expect.any(Array),
          }),
        );
      });
  });

  it('/expenses (GET) not Authorization', () => {
    return request(app.getHttpServer()).get('/expenses').expect(401);
  });
});
