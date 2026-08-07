import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category-dto';
import { UpdateCategoryDto } from './dto/updated-category.dto';

import { HttpException } from '@nestjs/common';
import { DatesService } from 'src/utils/dates/dates.service';
import { CategoryQueryParams } from './interfaces/category-query-params.interface';
import { Subcategory } from 'src/subcategories/entities/subcategory.entity';
import { Expense } from 'src/expenses/entities/expense.entity';
import { Income } from 'src/incomes/entities/income.entity';
export interface RawExpenseData {
  id: number;
  name: string;
  icon: string;
  userId: number;
  total: string | null;
  month: number | null;
  year: number | null;
}

interface CategoryAccumulator {
  id: number;
  name: string;
  icon: string;
  type: number;
  budget: number;
  userId: number;
  total: number;
  subcategories: { id: number; name: string; total: number }[];
}
interface HasDate {
  date: Date;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private datesService: DatesService,
  ) {}
  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const CategoryEntity = new Category();
    CategoryEntity.name = createCategoryDto.name;
    CategoryEntity.icon = createCategoryDto.icon;
    CategoryEntity.userId = createCategoryDto.userId;
    CategoryEntity.type = createCategoryDto.type;
    CategoryEntity.budget = createCategoryDto.budget;
    CategoryEntity.isOperational = createCategoryDto.isOperational ?? true;
    return this.categoriesRepository.save(CategoryEntity);
  }
  async findAll(userId: number, query: CategoryQueryParams) {
    const type = query ? query.type : 0;
    return this.categoriesRepository.find({
      where: { userId: userId, type },
      order: { name: 'ASC' },
    });
  }
  async findAllExpensesByMonth(userId: number, query: CategoryQueryParams) {
    const queryDate = query?.date ?? null;

    const startDate = query.startDate;
    const endDate = query.endDate;
    if (startDate && endDate) {
      return this.findAllExpensesByRangeDates(userId, startDate, endDate);
    }
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

  async findAllWithSubcategories(userId: number) {
    const data = await this.categoriesRepository.find({
      relations: { subcategories: true },
      where: { userId: userId, type: 0 },
      order: { name: 'ASC' },
    });
    return { data };
  }

  async findAllWithSubcategories2(userId: number, query: CategoryQueryParams) {
    const queryDate = query?.date ?? null;
    const data = await this.categoriesRepository.find({
      relations: { subcategories: { expenses: true } },
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
  mappingSubcategories(array: Subcategory[], queryDate: string | null) {
    let totalCategory = 0;
    const subcategories = array.map((m) => {
      let filtrado: Expense[] = [];
      if (queryDate) {
        filtrado = this.filterByDate(m.expenses, queryDate);
      }
      const total = this.calculateTotal(filtrado);
      totalCategory += total;
      return { ...m, expenses: filtrado, total };
    });
    return { totalCategory, subcategories };
  }
  filterByDate<T extends HasDate>(array: T[], queryDate: string | null): T[] {
    const start = this.datesService.startMonthRaw(queryDate);
    const end = this.datesService.endMonthRaw(queryDate);
    const filter = array.filter((e) => {
      const actual = this.datesService.getDate(e.date);
      return actual >= start && actual <= end;
    });
    return filter;
  }
  calculateTotal(array: Expense[]) {
    return array.reduce((acu: number, val) => acu + val.cost, 0);
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    const editCategory = Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(editCategory);
  }

  async remove(id: number) {
    const result = await this.categoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return result;
  }

  async findAllTypeIncome(userId: number, query: CategoryQueryParams) {
    const queryDate = query?.date ?? null;
    const data = await this.categoriesRepository.find({
      relations: { incomes: true },
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
  calculateTotalIncomes(myArray: Income[]) {
    return myArray.reduce((acu: number, val) => acu + val.amount, 0);
  }
  async findAllSubcategoriesExpensesByMonth(
    userId: number,
    query: CategoryQueryParams,
  ) {
    const queryDate = query?.date ?? null;

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
    const response = data.reduce((acc: CategoryAccumulator[], category) => {
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

  async findAllExpensesByRangeDates(
    userId: number,
    startDate: string,
    endDate: string,
  ) {
    const rawData = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.subcategories', 'subcategory')
      .leftJoinAndSelect(
        'subcategory.expenses',
        'expense',
        'expense.date BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
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
        'YEAR(expense.date) as year',
      ])
      .orderBy('YEAR(expense.date)', 'ASC')
      .addOrderBy('MONTH(expense.date)', 'ASC')
      .getRawMany();

    const { tableHead, rows } = this.generateTable(rawData);
    return { tableHead, rows };
  }

  generateTable(data: RawExpenseData[]): {
    tableHead: string[];
    rows: any[][];
  } {
    const tableHead: string[] = ['Categoria'];
    const rows: (string | number)[][] = [];

    const uniqueMonthsAndYears: string[] = Array.from(
      new Set(data.map((expense) => `${expense.year}-${expense.month}`)),
    )
      .filter((combined) => combined !== 'null-null') // Filtrar null-null
      .sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        return yearA - yearB || monthA - monthB; // Ordenar por año, luego por mes
      });

    uniqueMonthsAndYears.forEach((monthAndYear) => {
      tableHead.push(monthAndYear);
    });
    tableHead.push('Promedio');
    tableHead.push('Suma');
    const totals: number[] = Array(tableHead.length).fill(0);

    data.forEach((expense) => {
      // Omitir filas donde año y mes son null
      if (expense.year === null || expense.month === null) {
        return;
      }

      const rowIndex = rows.findIndex((row) => row[0] === expense.name);
      if (rowIndex === -1) {
        const newRow: (string | number)[] = [expense.name];
        let totalSoFar = 0;

        uniqueMonthsAndYears.forEach((monthAndYear, index) => {
          const [year, month] = monthAndYear.split('-');
          const expenseOfYear = data.find(
            (e) =>
              e.name === expense.name &&
              e.year === Number(year) &&
              e.month === Number(month),
          );

          if (expenseOfYear) {
            const expenseValue = Number(expenseOfYear.total);
            newRow.push(expenseValue);
            totalSoFar += expenseValue;
            totals[index + 1] +=
              typeof expenseValue === 'number' ? expenseValue : 0;
          } else {
            newRow.push(0);
          }
        });

        newRow.push(totalSoFar / uniqueMonthsAndYears.length); // Agregar la columna de promedio
        newRow.push(totalSoFar);
        totals[0] += totalSoFar;
        rows.push(newRow);
      }
    });
    // Agregar fila de totales
    const monthCount = uniqueMonthsAndYears.length; // Número de columnas de meses
    const averageTotal = monthCount > 0 ? totals[0] / monthCount : 0; // Promedio general
    const totalsRow: (string | number)[] = [
      'Totales',
      ...totals.slice(1, -2),
      averageTotal,
      totals[0],
    ];

    rows.push(totalsRow);

    return { tableHead, rows };
  }
}
