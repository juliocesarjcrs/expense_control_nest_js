import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category-dto';
import { UpdateCategoryDto } from './dto/updated-category.dto';

import { HttpException } from '@nestjs/common';
import { DatesService } from 'src/utils/dates/dates.service';
interface Expense {
  id: number;
  name: string;
  icon: string;
  userId: number;
  total: number;
  month: number | null;
  year: number | null;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private datesService: DatesService,
  ) { }
  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const CategoryEntity = new Category();
    CategoryEntity.name = createCategoryDto.name;
    CategoryEntity.icon = createCategoryDto.icon;
    CategoryEntity.userId = createCategoryDto.userId;
    CategoryEntity.type = createCategoryDto.type;
    CategoryEntity.budget = createCategoryDto.budget;
    return this.categoriesRepository.save(CategoryEntity);
  }
  async findAll(userId: number, query) {
    const type = query ? query.type : 0;
    return this.categoriesRepository.find({
      where: { userId: userId, type },
      order: { name: 'ASC' },
    });
  }
  async findAllExpensesByMonth(userId: number, query) {
    const queryDate = query ? query.date : null;

    const startDate = query.startDate;
    const endDate = query.endDate;
    if (startDate && endDate) {
      return this.findAllExpensesByRangeDates(userId, startDate, endDate)
    }
    console.log(`::: startDate ::: ${startDate}, ::: endDate ::: ${endDate}`)
    const data = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.subcategories', 'subcategory')
      .leftJoinAndSelect(
        'subcategory.expenses',
        'expense',
        'expense.date BETWEEN :startDate AND :endDate',
        {
          startDate: this.datesService.startMonthRawNew(queryDate),
          endDate: this.datesService.endMonthRawNew(queryDate),
        },
      )
      .where('category.userId = :userId', { userId: userId })
      .andWhere('category.type = :type', { type: 0 })
      .groupBy('category.id')
      .select([
        'category.id AS id',
        'category.name AS name',
        'category.icon AS icon',
        'category.userId AS userId',
        'SUM(expense.cost) AS total', // cálculo del total gastado en la categoría por mes
      ])
      .orderBy('category.name', 'ASC')
      .getRawMany();
    let totalGeneraly = 0;
    const dataFormat = data.map((category) => {
      const totalCategory = category.total ? parseFloat(category.total) : 0;
      totalGeneraly += totalCategory;
      return { ...category, total: totalCategory };
    });

    return { data: dataFormat, total: totalGeneraly };
  }

  async findAllWithSubcategories(userId: number, query) {
    const queryDate = query ? query.date : null;
    const data = await this.categoriesRepository.find({
      relations: ['subcategories', 'subcategories.expenses'],
      where: { userId: userId, type: 0 },
      order: { name: 'ASC' },
    });
    let totalGeneraly = 0;
    const dataFormat = data.map((e) => {
      const { totalCategory, subcategories } = this.mappingSubcategories(
        e.subcategories,
        queryDate,
      );
      totalGeneraly += totalCategory;
      return { ...e, subcategories, total: totalCategory };
    });
    return { data: dataFormat, total: totalGeneraly };
  }
  mappingSubcategories(array, queryDate) {
    let totalCategory = 0;
    const subcategories = array.map((m) => {
      const filtrado = this.filterByDate(m.expenses, queryDate);
      const total = this.calculateTotal(filtrado);
      totalCategory += total;
      return { ...m, expenses: filtrado, total };
    });
    return { totalCategory, subcategories };
  }
  filterByDate(array, queryDate) {
    const start = this.datesService.startMonthRaw(queryDate);
    const end = this.datesService.endMonthRaw(queryDate);
    const filter = array.filter((e) => {
      const actual = this.datesService.getDate(e.date);
      if (actual >= start && actual <= end) {
        return true;
      } else {
        return false;
      }
    });
    return filter;
  }
  calculateTotal(array) {
    return array.reduce((acu: number, val) => acu + parseFloat(val.cost), 0);
  }

  async findOne(id: number): Promise<Category> {
    return this.categoriesRepository.findOne({ where: { id: id } });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findOne({
      where: { id: id },
    });
    if (!category)
      throw new HttpException('Id not fount', HttpStatus.NOT_FOUND);
    const editCategory = Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(editCategory);
  }
  async remove(id: number) {
    return this.categoriesRepository.delete(id);
  }

  async findAllTypeIncome(userId: number, query) {
    const queryDate = query ? query.date : null;
    const data = await this.categoriesRepository.find({
      relations: ['incomes'],
      where: { userId: userId, type: 1 },
      order: { name: 'ASC' },
    });
    let totalGeneraly = 0;
    const dataFormat = data.map((category) => {
      const filtrado = this.filterByDate(category.incomes, queryDate);
      const total = this.calculateTotalIncomes(filtrado);
      totalGeneraly += total;
      return { ...category, incomes: filtrado, total };
    });
    return { data: dataFormat, total: totalGeneraly };
  }
  calculateTotalIncomes(myArray) {
    return myArray.reduce(
      (acu: number, val) => acu + parseFloat(val.amount),
      0,
    );
  }
  async findAllSubcategoriesExpensesByMonth(userId: number, query) {
    const queryDate = query ? query.date : null;

    const data = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.subcategories', 'subcategory')
      .leftJoinAndSelect(
        'subcategory.expenses',
        'expense',
        'expense.date BETWEEN :startDate AND :endDate',
        {
          startDate: this.datesService.startMonthRawNew(queryDate),
          endDate: this.datesService.endMonthRawNew(queryDate),
        },
      )
      .select([
        'category.id as id',
        'category.name as name',
        'category.icon as icon',
        'category.type as type',
        'category.budget as budget',
        'category.userId as userId',
        'subcategory.id as subcategoryId',
        'subcategory.name as subcategoryName',
        'SUM(expense.cost) as total',
      ])
      .where('category.userId = :userId', { userId })
      .andWhere('category.type = 0')
      .groupBy('category.id, subcategory.id')
      .orderBy('category.name', 'ASC')
      .addOrderBy('subcategory.name', 'ASC')
      .getRawMany();
    let totalGeneraly = 0;
    const response = data.reduce((acc, category) => {
      const {
        id,
        name,
        icon,
        type,
        budget,
        userId,
        subcategoryId,
        subcategoryName,
      } = category;
      const total = category.total ? parseFloat(category.total) : 0;
      totalGeneraly += total;
      const categoryIndex = acc.findIndex((c) => c.id === id);
      if (categoryIndex === -1) {
        acc.push({
          id,
          name,
          icon,
          type,
          budget,
          userId,
          total,
          subcategories: [{ id: subcategoryId, name: subcategoryName, total }],
        });
      } else {
        acc[categoryIndex].total += total;
        const subcategoryIndex = acc[categoryIndex].subcategories.findIndex(
          (s) => s.id === subcategoryId,
        );
        if (subcategoryIndex === -1) {
          acc[categoryIndex].subcategories.push({
            id: subcategoryId,
            name: subcategoryName,
            total,
          });
        } else {
          acc[categoryIndex].subcategories[subcategoryIndex].total += total;
        }
      }
      return acc;
    }, []);

    return { data: response, total: totalGeneraly };
  }

  async findAllExpensesByRangeDates(userId: number, startDate: string, endDate: string) {
    const rawData = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.subcategories', 'subcategory')
      .leftJoinAndSelect(
        'subcategory.expenses',
        'expense',
        'expense.date BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate
        },
      )
      .where('category.userId = :userId', { userId: userId })
      .andWhere('category.type = :type', { type: 0 })
      .groupBy('category.id')
      .addGroupBy('MONTH(expense.date)')
      .addGroupBy('YEAR(expense.date)')
      .select([
        'category.id AS id',
        'category.name AS name',
        'category.icon AS icon',
        'category.userId AS userId',
        'SUM(expense.cost) AS total',
        'MONTH(expense.date) as month',
        'YEAR(expense.date) as year'
      ])
      .orderBy('YEAR(expense.date)', 'ASC')
      .addOrderBy('MONTH(expense.date)', 'ASC')
      .getRawMany();

    const { tableHead, rows } = this.generateTable(rawData);
    return { tableHead, rows }

  }

  generateTable(data: Expense[]): { tableHead: string[], rows: any[][] } {
    const tableHead: string[] = ["Categoria"];
  const rows: (string | number)[][] = [];

  const uniqueMonthsAndYears: string[] = Array.from(new Set(data.map(expense => `${expense.year}-${expense.month}`)))
    .filter(combined => combined !== "null-null")  // Filtrar null-null
    .sort();

  uniqueMonthsAndYears.forEach(monthAndYear => {
    tableHead.push(monthAndYear);
  });
  tableHead.push('Promedio')

  data.forEach(expense => {
    // Omitir filas donde año y mes son null
    if (expense.year === null || expense.month === null) {
      return;
    }

    const rowIndex = rows.findIndex(row => row[0] === expense.name);
    if (rowIndex === -1) {
      const newRow: (string | number)[] = [expense.name];
      let totalSoFar = 0;

      uniqueMonthsAndYears.forEach(monthAndYear => {
        const [year, month] = monthAndYear.split('-');
        const expenseOfYear = data.find(e =>
          e.name === expense.name && e.year === Number(year) && e.month === Number(month)
        );

        if (expenseOfYear) {
          newRow.push(Number(expenseOfYear.total));
          totalSoFar += Number(expenseOfYear.total);
        } else {
          newRow.push(0);
        }
      });

      newRow.push(totalSoFar / uniqueMonthsAndYears.length); // Agregar la columna de promedio
      rows.push(newRow);
    }
  });

  return { tableHead, rows };
  }
}
