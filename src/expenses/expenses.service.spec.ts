import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatesService } from 'src/utils/dates/dates.service';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  let service: ExpensesService;
  const selectSpy = jest.fn().mockReturnThis();
  const addSelectSpy = jest.fn().mockReturnThis();
  const whereSpy = jest.fn().mockReturnThis();
  const andWhereSpy = jest.fn().mockReturnThis();
  const groupBySpy = jest.fn().mockReturnThis();
  const addGroupBySpy = jest.fn().mockReturnThis();
  const leftJoinAndSelectSpy = jest.fn().mockReturnThis();
  const orderBySpy = jest.fn().mockReturnThis();
  const addOrderBySpy = jest.fn().mockReturnThis();
  const offsetSpy = jest.fn().mockReturnThis();
  const limitSpy = jest.fn().mockReturnThis();
  const getRawManySpy = jest.fn();

  const mockExpenseRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((expense) =>
        Promise.resolve({ id: Date.now(), ...expense }),
      ),
    findOne: jest.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        createdAt: '2021-05-24T17:56:13.196Z',
        cost: 60000,
        commentary: '',
        date: '2021-05-24',
        subcategoryId: {
          id: 1,
          createdAt: '2021-05-24T16:19:10.623Z',
          name: 'Recibo Luz b',
          icon: null,
          categoryId: {
            id: 1,
            createdAt: '2021-05-24T16:18:13.023Z',
            name: 'ALIMENTACIÓN2',
            icon: 'home',
            type: 0,
          },
        },
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
      leftJoinAndSelect: leftJoinAndSelectSpy,
      orderBy: orderBySpy,
      addOrderBy: addOrderBySpy,
      offset: offsetSpy,
      limit: limitSpy,
      groupBy: groupBySpy,
      addGroupBy: addGroupBySpy,
      getRawMany: getRawManySpy,
    })),
  };
  const mockDatesService = {
    monthAgo: jest.fn().mockImplementation(() => '12-05-2021'),
    getFormatDate: jest.fn().mockImplementation((date) => {
      if (date == '2021-12-01T05:00:00.000Z') {
        return '2021-12-01';
      } else if (date == '2021-12-20T05:00:00.000Z') {
        return '2021-12-20';
      }
    }),
    getMonthString: jest.fn().mockImplementation((month) => {
      if (month == 9) {
        return 'septiembre';
      } else {
        return 'diciembre';
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
        {
          provide: DatesService,
          useValue: mockDatesService,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new Expense and return that', async () => {
    const date = new Date();
    const dataExpense = {
      cost: 10000,
      subcategoryId: 21,
      date,
      commentary: '',
      userId: 1000,
    };
    expect(await service.create(dataExpense)).toEqual({
      id: expect.any(Number),
      cost: 10000,
      subcategoryId: 21,
      date,
      commentary: '',
      userId: 1000,
    });
  });

  it('should be return all expenses', async () => {
    const expected = {
      graph: ['10000', '74000'],
      labels: ['septiembre', 'diciembre'],
      data: [
        {
          month: 9,
          sum: '10000',
        },
        {
          month: 12,
          sum: '74000',
        },
      ],
    };
    getRawManySpy.mockImplementation(() => {
      return [
        {
          month: 9,
          sum: '10000',
        },
        {
          month: 12,
          sum: '74000',
        },
      ];
    });
    const response = await service.findAll(1, {
      numMonths: 4,
    });
    expect(response).toEqual(expected);
    expect(response).toEqual(
      expect.objectContaining({
        graph: expect.any(Array),
        labels: expect.any(Array),
        data: expect.any(Array),
      }),
    );
  });

  it('should be return one expense', async () => {
    const expected = {
      id: 5,
      createdAt: '2021-05-24T17:56:13.196Z',
      cost: 60000,
      commentary: '',
      date: '2021-05-24',
      subcategoryId: {
        id: 1,
        createdAt: '2021-05-24T16:19:10.623Z',
        name: 'Recibo Luz b',
        icon: null,
        categoryId: {
          id: 1,
          createdAt: '2021-05-24T16:18:13.023Z',
          name: 'ALIMENTACIÓN2',
          icon: 'home',
          type: 0,
        },
      },
    };
    const response = await service.findOne(5);
    expect(response).toEqual(
      expect.objectContaining({
        cost: expect.any(Number),
        commentary: expect.any(String),
        subcategoryId: expect.any(Object),
      }),
    );
  });

  it('should be list last expenses paginate', async () => {
    const dataMock = [
      {
        expense_id: 28,
        expense_created_at: '2021-12-23T18:23:31.130Z',
        expense_cost: 50000,
        expense_commentary: 'prueba 2',
        expense_date: '2021-12-01T05:00:00.000Z',
        expense_user_id: 1,
        expense_subcategory_id: 2,
        subcategory_id: 2,
        subcategory_created_at: '2021-05-24T16:44:49.478Z',
        subcategory_name: 'Recibo Luz',
        subcategory_icon: null,
        subcategory_category_id: 1,
        subcategory_user_id: 1,
        categories_id: 1,
        categories_created_at: '2021-05-24T16:18:13.023Z',
        categories_name: 'ALIMENTACIÓN2',
        categories_icon: 'home',
        categories_type: 0,
        categories_user_id: 1,
      },
      {
        expense_id: 27,
        expense_created_at: '2021-12-20T13:24:41.295Z',
        expense_cost: 24000,
        expense_commentary: 'ingresado lunes 20 dic',
        expense_date: '2021-12-20T05:00:00.000Z',
        expense_user_id: 1,
        expense_subcategory_id: 16,
        subcategory_id: 16,
        subcategory_created_at: '2021-06-16T00:12:48.278Z',
        subcategory_name: 'una prueba',
        subcategory_icon: null,
        subcategory_category_id: 11,
        subcategory_user_id: 1,
        categories_id: 11,
        categories_created_at: '2021-05-27T20:43:05.955Z',
        categories_name: 'otra eliminar',
        categories_icon: 'cart-arrow-down',
        categories_type: 0,
        categories_user_id: 1,
      },
    ];
    getRawManySpy.mockImplementation(() => dataMock);

    const expected = {
      data: [
        {
          id: 28,
          createdAt: '2021-12-23T18:23:31.130Z',
          cost: 50000,
          commentary: 'prueba 2',
          date: '2021-12-01T05:00:00.000Z',
          dateFormat: '2021-12-01',
          category: 'ALIMENTACIÓN2',
          iconCategory: 'home',
          subcategory: 'Recibo Luz',
        },
        {
          id: 27,
          createdAt: '2021-12-20T13:24:41.295Z',
          cost: 24000,
          commentary: 'ingresado lunes 20 dic',
          date: '2021-12-20T05:00:00.000Z',
          dateFormat: '2021-12-20',
          category: 'otra eliminar',
          iconCategory: 'cart-arrow-down',
          subcategory: 'una prueba',
        },
      ],
    };
    const response = await service.findLast(1, { page: 1, query: '' });
    expect(response).toEqual(expected);
  });

  it('should be delete one expense', async () => {
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
