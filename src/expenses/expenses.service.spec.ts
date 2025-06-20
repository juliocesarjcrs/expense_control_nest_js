import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatesService } from 'src/utils/dates/dates.service';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';
import { ExpenseSearchOptions } from './  expense-search-options.interface';

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

      switch (month) {
        case 1:
          return 'ene';
        case 2:
          return 'feb';
        case 3:
          return 'mar';
        case 4:
          return 'abr';
        case 5:
          return 'may';
        case 6:
          return 'jun';
        case 7:
          return 'jul';
        case 8:
          return 'ago';
        case 9:
          return 'sep';
        case 10:
          return 'oct';
        case 11:
          return 'nov';
        case 12:
          return 'dic';
        default:
          break;
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
      labels: ['sep 2021', 'dic 2021'],
      data: [
        {
          month: 9,
          year: 2021,
          sum: '10000',
        },
        {
          month: 12,
          year: 2021,
          sum: '74000',
        },
      ],
      average: 42000,
      previosAverage: 10000,
    };
    getRawManySpy.mockImplementation(() => {
      return [
        {
          month: 9,
          year: 2021,
          sum: '10000',
        },
        {
          month: 12,
          year: 2021,
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

  describe('findExpensesBySubcategories filtering', () => {
    const mockExpenses = [
      {
        id: 1,
        userId: 1,
        subcategoryId: 1424,
        date: new Date('2022-06-01'),
        cost: 100,
        commentary: 'Lunch',
      },
      {
        id: 2,
        userId: 1,
        subcategoryId: 1424,
        date: new Date('2022-06-02'),
        cost: 200,
        commentary: 'Dinner',
      },
      {
        id: 3,
        userId: 1,
        subcategoryId: 1425,
        date: new Date('2022-06-03'),
        cost: 150,
        commentary: 'Taxi',
      },
      {
        id: 4,
        userId: 1,
        subcategoryId: 1424,
        date: new Date('2022-06-04'),
        cost: 300,
        commentary: 'Groceries',
      },
    ];

    let service: ExpensesService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ExpensesService,
          {
            provide: getRepositoryToken(Expense),
            useValue: {
              createQueryBuilder: jest.fn(() => {
                const query: any = {
                  _userId: null,
                  _subcategoriesIds: [],
                  _startDate: undefined,
                  _endDate: undefined,
                  _search: '',
                  _orderBy: undefined,
                  _order: undefined,
                  select() { return this; },
                  where(sql: any, params: any) {
                    if (params?.userId) this._userId = params.userId;
                    if (params?.subcategoriesId) this._subcategoriesIds = params.subcategoriesId;
                    return this;
                  },
                  andWhere(sql: any, params: any) {
                    if (sql.includes('date >= ')) {
                      this._startDate = params.startDateFormat;
                    }
                    if (sql.includes('date <= ')) {
                      this._endDate = params.endDateFormat;
                    }
                    if (sql.includes('cost LIKE') || sql.includes('commentary LIKE')) {
                      this._search = params.searchValue;
                    }
                    if (sql.includes('subcategoryId IN')) {
                      this._subcategoriesIds = params.subcategoriesId;
                    }
                    return this;
                  },
                  orderBy(field?: string, order?: 'ASC' | 'DESC') {
                    this._orderBy = field;
                    this._order = order;
                    return this;
                  },
                  leftJoinAndSelect() {
                    return this;
                  },
                  addSelect() {
                    return this;
                  },
                  getMany() {
                    let result = mockExpenses;
                    if (this._userId !== null) {
                      result = result.filter(e => e.userId === this._userId);
                    }
                    if (this._subcategoriesIds && this._subcategoriesIds.length > 0) {
                      result = result.filter(e => this._subcategoriesIds.includes(e.subcategoryId));
                    }
                    if (this._startDate) {
                      result = result.filter(e =>
                        mockDatesService.getFormatDate(e.date) >= this._startDate
                      );
                    }
                    if (this._endDate) {
                      result = result.filter(e =>
                        mockDatesService.getFormatDate(e.date) <= this._endDate
                      );
                    }
                    if (this._search) {
                      const search = this._search.replace(/%/g, '');
                      result = result.filter(
                        e =>
                          e.cost.toString().includes(search) ||
                          e.commentary.includes(search)
                      );
                    }
                    if (this._orderBy) {
                      result = result.sort((a, b) => {
                        if (this._orderBy === 'expense.date') {
                          return this._order === 'DESC'
                            ? b.date.getTime() - a.date.getTime()
                            : a.date.getTime() - b.date.getTime();
                        }
                        if (this._orderBy === 'expense.amount') {
                          return this._order === 'DESC'
                            ? b.cost - a.cost
                            : a.cost - b.cost;
                        }
                        return 0;
                      });
                    }
                    return Promise.resolve(result);
                  },
                  setParameter() {
                    return this;
                  },
                };
                return query;
              }),
            },
          },
          {
            provide: 'DatesService',
            useValue: mockDatesService,
          },
          {
            provide: mockDatesService.constructor,
            useValue: mockDatesService,
          },
          {
            provide: DatesService,
            useValue: mockDatesService,
          },
        ],
      }).compile();

      service = module.get<ExpensesService>(ExpensesService);
    });

    it('should filter by subcategories and date when searchValue is empty', async () => {
      const userId = 1;
      const options: ExpenseSearchOptions = {
        subcategoriesId: [1424],
        startDate: new Date('2022-06-01'),
        endDate: new Date('2022-06-30'),
        searchValue: '',
      };
      const result = await service.findExpensesBySubcategories(userId, options.subcategoriesId!, options);
      expect(result.expenses).toHaveLength(3);
      expect(result.expenses.every(e => e.subcategoryId === 1424)).toBe(true);
    });

    it('should filter by subcategories, date, and searchValue (matching commentary)', async () => {
      const userId = 1;
      const options: ExpenseSearchOptions = {
        subcategoriesId: [1424],
        startDate: new Date('2022-06-01'),
        endDate: new Date('2022-06-30'),
        searchValue: 'Lunch',
      };
      const result = await service.findExpensesBySubcategories(userId, options.subcategoriesId!, options);
      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].commentary).toBe('Lunch');
    });

    it('should filter by subcategories, date, and searchValue (matching cost)', async () => {
      const userId = 1;
      const options: ExpenseSearchOptions = {
        subcategoriesId: [1424],
        startDate: new Date('2022-06-01'),
        endDate: new Date('2022-06-30'),
        searchValue: '300',
      };
      const result = await service.findExpensesBySubcategories(userId, options.subcategoriesId!, options);
      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].cost).toBe(300);
    });

    it('should return empty array if no expense matches all filters', async () => {
      const userId = 1;
      const options: ExpenseSearchOptions = {
        subcategoriesId: [1424],
        startDate: new Date('2022-06-01'),
        endDate: new Date('2022-06-30'),
        searchValue: 'Nonexistent',
      };
      const result = await service.findExpensesBySubcategories(userId, options.subcategoriesId!, options);
      expect(result.expenses).toHaveLength(0);
    });
  });
});
