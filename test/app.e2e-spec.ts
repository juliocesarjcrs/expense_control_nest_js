import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { setupTestApp } from './utils/setup-app';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => await app.close());

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
