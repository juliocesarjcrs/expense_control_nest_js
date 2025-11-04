import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Connection } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/entities/user.entity';
import { loadFixtures as loadFixturesBase } from './utils/utils';
import { userOneSaved } from './utils/data';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let connection: Connection;

  const loadFixtures = async (sqlFileName: string) =>
    loadFixturesBase(connection, sqlFileName);

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = app.get(Connection);
    await loadFixtures('1-users.sql');
    await loadFixtures('2-categories.sql');
    await loadFixtures('3-subcategories.sql');
    await loadFixtures('4-expenses.sql');
  });

  afterAll(async () => {
    await app.close();
  });

  const tokenForUser = (user: Partial<User> = userOneSaved): string => {
    return app.get(AuthService).getTokenForUser(user as User);
  };

  describe('/categories/expenses/month (GET)', () => {
    it('should return a list of categories for the month', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/expenses/month?date=2022-05-15')
        .set('Authorization', `Bearer ${tokenForUser()}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          data: expect.any(Array),
        }),
      );
    });

    it('should return a 401 status code if not authorized', async () => {
      await request(app.getHttpServer())
        .get('/categories/expenses/month?date=2022-05-15')
        .expect(401);
    });
  });

  describe('/categories/subcategories/expenses/month (GET)', () => {
    it('should return a list of categories for the month', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/subcategories/expenses/month?date=2022-05-15')
        .set('Authorization', `Bearer ${tokenForUser()}`)
        .expect(200);

      expect(response.body).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            icon: expect.any(String),
            type: expect.any(Number),
            budget: expect.any(Number),
            userId: expect.any(Number),
            total: expect.any(Number),
            subcategories: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(Number),
                name: expect.any(String),
                total: expect.any(Number),
              }),
            ]),
          }),
        ]),
        total: expect.any(Number),
      });
    });

    it('should return a 401 status code if not authorized', async () => {
      await request(app.getHttpServer())
        .get('/categories/subcategories/expenses/month?date=2022-05-15')
        .expect(401);
    });
  });
});
