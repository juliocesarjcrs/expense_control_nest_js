import { Test } from '@nestjs/testing';
import { CategoriesService, RawExpenseData } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { DatesService } from 'src/utils/dates/dates.service';
import { CreateCategoryDto } from './dto/create-category-dto';

describe('CategoriesService', () => {
  let categoriesService: CategoriesService;
  let categoriesRepository: Repository<Category>;
  let datesService: DatesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        DatesService,
        {
          provide: getRepositoryToken(Category),
          useClass: Repository,
        },
      ],
    }).compile();

    categoriesService = moduleRef.get<CategoriesService>(CategoriesService);
    categoriesRepository = moduleRef.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    datesService = moduleRef.get<DatesService>(DatesService);
  });

  describe('createCategory', () => {
    it('should create a category', async () => {
      const category: Category = {
        id: 1,
        name: 'category',
        icon: 'icon',
        userId: 1,
        type: 0,
        budget: 100,
        user: 1,
        subcategories: [],
        incomes: [],
        createdAt: new Date(),
      };
      jest
        .spyOn(categoriesRepository, 'save')
        .mockImplementation(async () => category);
      const createCategoryDto: CreateCategoryDto = {
        name: 'category',
        icon: 'icon',
        userId: 1,
        type: 0,
        budget: 100,
      };
      const result = await categoriesService.createCategory(createCategoryDto);
      expect(result).toEqual(category);
    });
  });

  describe('findAllExpensesByMonth', () => {
    it('should return all expenses by month', async () => {
      const query = { date: '2023-04-01' };
      const userId = 1;
      jest.spyOn(categoriesRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValueOnce([
          {
            id: 1,
            name: 'category',
            icon: 'icon',
            userId: 1,
            total: '100.00',
          },
        ]),
      } as any);
      const startMonthRawNewSpy = jest.spyOn(datesService, 'startMonthRawNew');
      startMonthRawNewSpy.mockReturnValue('2023-04-01');
      const endMonthRawNewSpy = jest.spyOn(datesService, 'endMonthRawNew');
      endMonthRawNewSpy.mockReturnValue('2023-04-30');
      const result = await categoriesService.findAllExpensesByMonth(
        userId,
        query,
      );
      expect(result).toEqual({
        data: [
          { id: 1, name: 'category', icon: 'icon', userId: 1, total: 100 },
        ],
        total: 100,
      });
    });
  });
  describe('findAllSubcategoriesExpensesByMonth', () => {
    it('should return all subcategories expenses by month', async () => {
      const query = { date: '2023-04-01' };
      const userId = 1;
      jest.spyOn(categoriesRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValueOnce([
          {
            id: 1,
            name: 'category',
            icon: 'icon',
            type: 0,
            budget: 100,
            userId: 1,
            subcategoryId: 1,
            subcategoryName: 'subcategory',
            total: '100.00',
          },
        ]),
      } as any);
      const startMonthRawNewSpy = jest.spyOn(datesService, 'startMonthRawNew');
      startMonthRawNewSpy.mockReturnValue('2023-04-01');
      const endMonthRawNewSpy = jest.spyOn(datesService, 'endMonthRawNew');
      endMonthRawNewSpy.mockReturnValue('2023-04-30');
      const result =
        await categoriesService.findAllSubcategoriesExpensesByMonth(
          userId,
          query,
        );
      expect(result).toEqual({
        data: [
          {
            id: 1,
            name: 'category',
            icon: 'icon',
            type: 0,
            budget: 100,
            userId: 1,
            total: 100,
            subcategories: [{ id: 1, name: 'subcategory', total: 100 }],
          },
        ],
        total: 100,
      });
    });
  });
  describe('generateTable', () => {
    it('should return table format', async () => {
      const data: RawExpenseData[] = [
        {
          id: 414,
          name: 'Alimentación',
          icon: 'shopping-cart',
          userId: 44,
          total: null,
          month: null,
          year: null,
        },
        {
          id: 434,
          name: 'Transporte',
          icon: 'automobile',
          userId: 44,
          total: '10',
          month: 8,
          year: 2023,
        },
        {
          id: 414,
          name: 'Alimentación',
          icon: 'shopping-cart',
          userId: 44,
          total: '20',
          month: 8,
          year: 2023,
        },
        {
          id: 374,
          name: 'Vivienda',
          icon: 'home',
          userId: 44,
          total: '30',
          month: 8,
          year: 2023,
        },
        {
          id: 375,
          name: 'Vivienda',
          icon: 'home',
          userId: 44,
          total: '50',
          month: 9,
          year: 2023,
        },
      ];

      const result = await categoriesService.generateTable(data);
      expect(result).toEqual({
        tableHead: ['Categoria', '2023-8', '2023-9', 'Promedio', 'Suma'],
        rows: [
          ['Transporte', 10, 0, 5, 10],
          ['Alimentación', 20, 0, 10, 20],
          ['Vivienda', 30, 50, 40, 80],
          ['Totales', 60, 50, 55, 110],
        ],
      });
    });
  });
});
