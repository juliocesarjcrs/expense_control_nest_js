import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { IncomesModule } from '../src/incomes/incomes.module';
import { IncomesService } from '../src/incomes/incomes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Income } from 'src/incomes/entities/income.entity';
import { AppModule } from 'src/app.module';

describe('IncomesController (e2e)', () => {
  let app: INestApplication;
  // const incomesService = { findAll: () => ['test'] };
  const mockIncomeRepository = {
    findAll: jest.fn().mockResolvedValue({
      incomes: ['200000'],
      data: [{ month: 6, sum: '200000' }],
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // .overrideProvider(getRepositoryToken(Income))
      // .useValue(mockIncomeRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    // app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => await app.close());

  it('/incomes (GET)', () => {
    return request(app.getHttpServer())
      .get('/incomes')
      .set(
        'Authorization',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxLCJjcmVhdGVkQXQiOiIyMDIxLTA1LTI0VDE2OjE2OjM4LjU3NVoiLCJuYW1lIjoiSlVseSIsImltYWdlIjpudWxsLCJlbWFpbCI6ImNvcnJlb0Bjb3JyZW8uY29tIiwicGFzc3dvcmQiOiIkMmIkMTAkTkRXdksuLmRMNTFOQzlkYnE4UkpRdTFaU3pnUk54d2Y4VVd4MUhZYXRrNkJvbFpSUkF3ZkciLCJyZWNvdmVyeUNvZGUiOjkzNDEsInJvbGUiOjB9LCJzdWIiOjEsImlhdCI6MTYzMjc3Njc2OSwiZXhwIjoxNjQwNTUyNzY5fQ.edPAPJVraAcTlRG9tAmZWBsJ1UdNHALsWM54XmfW9YA',
      )
      .expect(200)
      .then((response) => {
        console.log(' REPOSMS', response.body);
        expect(response.body.data.length).toBe(1);
      });
  });

  it('/incomes (GET) not Authorization', () => {
    return request(app.getHttpServer()).get('/incomes').expect(401);
  });
});
