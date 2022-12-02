import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Connection } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { userOneSaved } from './utils/data';
import { User } from 'src/users/entities/user.entity';
import { loadFixtures as loadFixturesBase } from './utils/utils';

let app: INestApplication;
let mod: TestingModule;
let connection: Connection;

const loadFixtures = async (sqlFileName: string) =>
  loadFixturesBase(connection, sqlFileName);

export const tokenForUser = (user: Partial<User> = userOneSaved): string => {
  return app.get(AuthService).getTokenForUser(user as User);
};

const newExpense = {
  commentary: 'prueba',
  cost: 700000,
  subcategoryId: 2,
  date: '2021-12-01',
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
    await loadFixtures('2-categories.sql');
    await loadFixtures('3-subcategories.sql');
    await loadFixtures('4-expenses.sql');
  });

  afterAll(async () => app.close());

  it('/expenses (POST) shoud be create expenses', async () => {
    const response = await request(app.getHttpServer())
      .post('/expenses')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .send(newExpense)
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        subcategoryId: newExpense.subcategoryId,
        cost: newExpense.cost,
        commentary: newExpense.commentary,
        date: newExpense.date,
        id: expect.any(Number),
        createdAt: expect.any(String),
      }),
    );
  });

  it('/expenses (GET) should be List expenses graph balance "Ultimos meses"', () => {
    return request(app.getHttpServer())
      .get('/expenses')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        // expect(response.body.data.length).toBe(4);
        expect(response.body).toEqual(
          expect.objectContaining({
            graph: expect.any(Array),
            labels: expect.any(Array),
            data: expect.any(Array),
          }),
        );
      });
  });

  it('/expenses (GET) should be List expenses graph with query params', () => {
    return request(app.getHttpServer())
      .get('/expenses?numMonths=7')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        // expect(response.body.data.length).toBe(7);
        // expect(response.body.average).toBe(151700);
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
