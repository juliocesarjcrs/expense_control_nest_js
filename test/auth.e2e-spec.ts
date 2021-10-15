import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

import { AppModule } from 'src/app.module';
import { Connection } from 'typeorm';
let app: INestApplication;
let mod: TestingModule;
let connection: Connection;
let token: string;
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
const passwordUser2 = '123';
const user2 = {
  email: 'user2@correo.com',
  password: passwordUser2,
};

describe('AuthController (e2e)', () => {
  beforeAll(async () => {
    mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = mod.createNestApplication();
    await app.init();

    connection = app.get(Connection);
  });

  afterAll(async () => await app.close());

  it('/auth/login (POST) should return a JWT token on successful login', async () => {
    await loadFixtures('1-users.sql');
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send(user2)
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        token = res.body.access_token;
      });
  });

  it('/auth/login (POST) should return a validations login', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.access_token).toBeUndefined();
        expect(res.body).toEqual(
          expect.objectContaining({
            message: 'Email or password incorrect',
            statusCode: 400,
          }),
        );
      });
  });

  it('/auth/forgot-password (POST) should send email with code recovery password', async () => {
    return request(app.getHttpServer())
      .post('/auth/forgot-password')
      .set('Accept', 'application/json')
      .send({ email: user2.email })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            user: expect.any(Object),
            email: expect.any(Object),
          }),
        );
      });
  });

  it('/auth/fcheck-recovery-code/1?recoveryCode=9341 (GET) STEP 2: should check Code for recovery password', async () => {
    return request(app.getHttpServer())
      .get('/auth/check-recovery-code/1?recoveryCode=9341')
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            checkCode: true,
          }),
        );
      });
  });

  it('/auth/password-recovery/1 (PUT) should be set a new password', async () => {
    return request(app.getHttpServer())
      .put('/auth/password-recovery/1')
      .set('Accept', 'application/json')
      .send({ password: user2.password })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            user: expect.any(Object),
          }),
        );
      });
  });
});
