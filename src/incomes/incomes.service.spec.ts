import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatesService } from 'src/utils/dates/dates.service';
import { Income } from './entities/income.entity';
import { IncomesService } from './incomes.service';

describe('IncomesService', () => {
  let service: IncomesService;
  const selectSpy = jest.fn().mockReturnThis();
  const addSelectSpy = jest.fn().mockReturnThis();
  const whereSpy = jest.fn().mockReturnThis();
  const andWhereSpy = jest.fn().mockReturnThis();
  const groupBySpy = jest.fn().mockReturnThis();
  const addGroupBySpy = jest.fn().mockReturnThis();
  const orderBySpy = jest.fn().mockReturnThis();
  const addOrderBySpy = jest.fn().mockReturnThis();
  const getRawManySpy = jest
    .fn()
    .mockReturnValueOnce([{ month: 6, sum: '200000' }]);
  const mockIncomeRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((income) =>
        Promise.resolve({ id: Date.now(), ...income }),
      ),
    findOne: jest.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        createdAt: '2021-06-01T14:49:08.952Z',
        amount: 300000,
        commentary: null,
        date: '2021-05-31',
      }),
    ),
    delete: jest.fn().mockImplementation(() =>
      Promise.resolve({
        raw: {
          fieldCount: 0,
          affectedRows: 1,
          insertId: 0,
          serverStatus: 2,
          warningCount: 0,
          message: '',
          protocol41: true,
          changedRows: 0,
        },
        affected: 1,
      }),
    ),
    createQueryBuilder: jest.fn(() => ({
      select: selectSpy,
      addSelect: addSelectSpy,
      where: whereSpy,
      andWhere: andWhereSpy,
      groupBy: groupBySpy,
      orderBy: orderBySpy,
      addOrderBy: addOrderBySpy,
      addGroupBy: addGroupBySpy,
      getRawMany: getRawManySpy,
    })),
  };
  const mockDatesService = {
    monthAgo: jest.fn().mockImplementation(() => '12-05-2021'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomesService,
        {
          provide: getRepositoryToken(Income),
          useValue: mockIncomeRepository,
        },
        {
          provide: DatesService,
          useValue: mockDatesService,
        },
      ],
    }).compile();

    service = module.get<IncomesService>(IncomesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new Income and return that', async () => {
    const date = new Date();
    const dataIncome = {
      amount: 2450000,
      categoryId: 21,
      date,
      commentary: '',
      userId: 1000,
    };
    expect(await service.create(dataIncome)).toEqual({
      id: expect.any(Number),
      amount: 2450000,
      categoryId: 21,
      date,
      commentary: '',
      userId: 1000,
    });
  });

  it('should be return all incomes', async () => {
    const expected = {
      incomes: ['200000'],
      data: [{ month: 6, sum: '200000' }],
    };
    const response = await service.findAll(1, {
      numMonths: 4,
    });
    expect(response).toEqual(expected);
    expect(response).toEqual(
      expect.objectContaining({
        incomes: expect.any(Array),
        data: expect.any(Array),
      }),
    );
  });

  it('should be return one income', async () => {
    const expected = {
      id: 5,
      createdAt: '2021-06-01T14:49:08.952Z',
      amount: 300000,
      commentary: null,
      date: '2021-05-31',
    };
    const response = await service.findOne(5);
    expect(response).toEqual(expected);
  });

  it('should be edit a Income and return that', async () => {
    const date = new Date();
    const dataIncome = {
      amount: 2450000,
      categoryId: 21,
      date,
      commentary: '',
      userId: 1000,
    };
    expect(await service.update(1, dataIncome)).toEqual({
      id: expect.any(Number),
      amount: 2450000,
      categoryId: 21,
      date,
      commentary: '',
      userId: 1000,
      createdAt: expect.any(String),
    });
  });

  it('should be delete one income', async () => {
    const expected = {
      raw: {
        fieldCount: 0,
        affectedRows: 1,
        insertId: 0,
        serverStatus: 2,
        warningCount: 0,
        message: '',
        protocol41: true,
        changedRows: 0,
      },
      affected: 1,
    };
    const response = await service.remove(5);
    expect(response).toEqual(expected);
  });
});
