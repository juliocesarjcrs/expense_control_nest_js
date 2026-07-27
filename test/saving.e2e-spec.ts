import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { userSaved } from './utils/data';
import { User } from 'src/users/entities/user.entity';
import { cleanDatabase, loadFixtures as loadFixturesBase } from './utils/utils';
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
    await loadFixtures('2-categories.sql');
    await loadFixtures('3-subcategories.sql');
    await loadFixtures('4-expenses.sql');
  });

  afterAll(async () => await app.close());

  it('/saving (GET) not Authorization', () => {
    return request(app.getHttpServer()).get('/saving').expect(401);
  });

  it('/saving (GET) should return all savings by user', () => {
    return request(app.getHttpServer())
      .get('/saving')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        expect(response.body.data.length).toBe(0);
        expect(response.body).toEqual(
          expect.objectContaining({
            graph: expect.any(Object),
            data: expect.any(Array),
          }),
        );
      });
  });
});
