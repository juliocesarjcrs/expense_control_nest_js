import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { userSaved } from './utils/data';
import { User } from 'src/users/entities/user.entity';
import {
  cleanDatabase,
  loadFixtures as loadFixturesBase,
  // tokenForUser as tokenForUserBase,
} from './utils/utils';
import { setupTestApp } from './utils/setup-app';

let app: INestApplication;
let dataSource: DataSource;

const loadFixtures = async (sqlFileName: string) =>
  loadFixturesBase(dataSource, sqlFileName);

export const tokenForUser = (user: Partial<User> = userSaved): string => {
  const res = app.get(AuthService).getTokenForUser(user as User);
  return res;
};

describe('IncomesController (e2e)', () => {
  beforeAll(async () => {
    app = await setupTestApp();
    dataSource = app.get(DataSource);
    await cleanDatabase(dataSource);
    await loadFixtures('1-users.sql');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/incomes (GET)', () => {
    return request(app.getHttpServer())
      .get('/incomes')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        expect(response.body.data.length).toBe(0);
        expect(response.body).toEqual(
          expect.objectContaining({
            incomes: expect.any(Array),
            data: expect.any(Array),
          }),
        );
      });
  });

  it('/incomes (GET) not Authorization', () => {
    return request(app.getHttpServer()).get('/incomes').expect(401);
  });
});
