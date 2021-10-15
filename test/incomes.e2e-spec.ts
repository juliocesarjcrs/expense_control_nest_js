import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

import { AppModule } from 'src/app.module';
import { Connection } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { userSaved } from './utils/data';
import { User } from 'src/users/entities/user.entity';
let app: INestApplication;
let mod: TestingModule;
let connection: Connection;
const loadFixtures = async (sqlFileName: string) => {
  const sql = fs.readFileSync(
    path.join(__dirname, 'fixtures', sqlFileName),
    'utf8',
  );

  const queryRunner = connection.driver.createQueryRunner('master');

  for (const c of sql.split(';')) {
    await queryRunner.query(c);
  }
};

export const tokenForUser = (user: Partial<User> = userSaved): string => {
  const res = app.get(AuthService).getTokenForUser(user as User);
  return res;
};

describe('IncomesController (e2e)', () => {
  beforeAll(async () => {
    mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = mod.createNestApplication();
    await app.init();

    connection = app.get(Connection);
    await loadFixtures('1-users.sql');
  });

  afterAll(async () => await app.close());

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
