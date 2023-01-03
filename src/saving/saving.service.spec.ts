import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpensesService } from 'src/expenses/expenses.service';
import { IncomesService } from 'src/incomes/incomes.service';
import { DatesService } from 'src/utils/dates/dates.service';
import { Saving } from './entities/saving.entity';
import { SavingService } from './saving.service';

describe('SavingService', () => {
  let service: SavingService;
  const selectSpy = jest.fn().mockReturnThis();
  const addSelectSpy = jest.fn().mockReturnThis();
  const whereSpy = jest.fn().mockReturnThis();
  const andWhereSpy = jest.fn().mockReturnThis();
  const groupBySpy = jest.fn().mockReturnThis();
  const addGroupBySpy = jest.fn().mockReturnThis();
  const orderBySpy = jest.fn().mockReturnThis();
  const addOrderBySpy = jest.fn().mockReturnThis();
  const mockGetMany = [
    {
      id: 9,
      createdAt: '2023-01-03T12:11:06.792Z',
      saving: 27925,
      expense: 4082624,
      income: 4110549,
      commentary: null,
      date: '2022-09-01',
      userId: 44,
    },
  ];
  const getMany = jest.fn().mockImplementation(() => mockGetMany);
  const mockSavingRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((saving) =>
        Promise.resolve({ id: Date.now(), ...saving }),
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
      getMany: getMany,
    })),
  };
  const mockDatesService = {
    monthAgo: jest.fn().mockImplementation(() => '12-05-2021'),
    customFormatDate: jest.fn().mockImplementation((date) => {
      return { monthYear: 'Oct. 2023' };
    }),
  };

  const mockIncomesService = {};
  const mockExpenseService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavingService,
        {
          provide: getRepositoryToken(Saving),
          useValue: mockSavingRepository,
        },
        {
          provide: DatesService,
          useValue: mockDatesService,
        },
        {
          provide: IncomesService,
          useValue: mockIncomesService,
        },
        {
          provide: ExpensesService,
          useValue: mockExpenseService,
        },
      ],
    }).compile();

    service = module.get<SavingService>(SavingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new saving and return that', async () => {
    const date = new Date();
    const dataSaving = {
      expense: 2000000,
      income: 3500000,
      saving: 1500000,
      date,
      commentary: '',
      userId: 1000,
    };
    expect(await service.create(dataSaving)).toEqual({
      id: expect.any(Number),
      expense: 2000000,
      income: 3500000,
      saving: 1500000,
      date,
      commentary: '',
      userId: 1000,
    });
  });

  it('should be return all savings of user', async () => {
    const expected = {
      graph: {
        labels: ['Oct. 2023'],
        expenses: [4082624],
        incomes: [4110549],
        savings: [27925],
      },
      data: mockGetMany,
    };
    const response = await service.findAll(1, {
      numMonths: 4,
    });
    expect(response).toEqual(expected);
    expect(response).toEqual(
      expect.objectContaining({
        graph: expect.any(Object),
        data: expect.any(Array),
      }),
    );
  });
});
