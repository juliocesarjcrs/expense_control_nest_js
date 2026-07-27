import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/entities/user.entity';
import { userSaved } from './utils/data';

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

describe('FilesController (e2e)', () => {
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
