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
  role: '1'
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

describe('UsersController (e2e)', () => {
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

  it('/users (POST) shoud be create user', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send(newUser)
      .expect(201)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            name: newUser.name,
            image: null,
            email: newUser.email,
            recoveryCode: null,
            id: expect.any(Number),
            createdAt: expect.any(String),
            role: expect.any(Number),
          }),
        );
      });
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        expect(response.body.length).toBe(3);
      });
  });

  it('/users (POST) validation error There is already a user with this email', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send(newUser)
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            message: 'There is already a user with this email',
          }),
        );
      });
  });

  it('/users:id (GET) should be list one user', () => {
    return request(app.getHttpServer())
      .get('/users/1')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            email: expect.any(String),
            id: expect.any(Number),
            createdAt: expect.any(String),
            role: expect.any(Number),
          }),
        );
      });
  });

  it('/users:id (GET) validation error Id not found', () => {
    return request(app.getHttpServer())
      .get('/users/100')
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            message: 'Id not found',
          }),
        );
      });
  });

  it('/users/change-password/1 (PUT) validation password incorrect', () => {
    return request(app.getHttpServer())
      .put('/users/change-password/1')
      .send(objChangePassword)
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            message: 'password incorrect',
          }),
        );
      });
  });

  it('/users/change-password/1 (PUT) shoud be change password', () => {
    const objChangePasswordCorrect = {
      currentlyPassword: '1234',
      password: '1234',
      passwordComfirm: '1234',
    };
    return request(app.getHttpServer())
      .put('/users/change-password/1')
      .send(objChangePasswordCorrect)
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            email: expect.any(String),
            id: expect.any(Number),
            createdAt: expect.any(String),
            role: expect.any(Number),
          }),
        );
      });
  });

  it('/users/:id (PUT) validation error The mail already exists', () => {
    const dataUddate = {
      name: 'julio',
      email: 'user3@correo.com',
    };
    return request(app.getHttpServer())
      .put('/users/1')
      .send(dataUddate)
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            message: 'The mail already exists',
          }),
        );
      });
  });

  it('/users/:id (PUT) shoud be update user', () => {
    const dataUpdate = {
      name: 'julio',
      email: 'new@correo.com',
    };
    return request(app.getHttpServer())
      .put('/users/1')
      .send(dataUpdate)
      .set('Authorization', `Bearer ${tokenForUser()}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            name: dataUpdate.name,
            // image: null,
            email: dataUpdate.email,
            // recoveryCode: null,
            id: expect.any(Number),
            createdAt: expect.any(String),
            role: expect.any(Number),
          }),
        );
      });
  });
});
