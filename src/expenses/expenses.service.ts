import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatesService } from 'src/utils/dates/dates.service';
import { Between, Brackets, Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';
import { downloadResourceCsv } from 'src/utils/helpers/file-helper';
@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    private datesService: DatesService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto) {
    const ExpenseEntity = new Expense();

    ExpenseEntity.userId = createExpenseDto.userId;
    ExpenseEntity.subcategoryId = createExpenseDto.subcategoryId;
    ExpenseEntity.cost = createExpenseDto.cost;
    ExpenseEntity.commentary = createExpenseDto.commentary;
    ExpenseEntity.date = createExpenseDto.date;
    return this.expensesRepository.save(ExpenseEntity);
  }

  async findAll(userId: number, query: { numMonths: number }) {
    const numMonths = query.numMonths || 4;
    const expensesGroupByMonth = await this.expensesRepository
      .createQueryBuilder('expense')
      .select(['MONTH(expense.date) as month', 'YEAR(expense.date) as year'])
      .addSelect('SUM(expense.cost)', 'sum')
      .where('expense.date >= :mydate', {
        mydate: this.datesService.monthAgo(numMonths),
      })
      .andWhere('expense.user_id = :userId', { userId })
      .groupBy('MONTH(expense.date)')
      .addGroupBy('YEAR(expense.date)')
      .orderBy('YEAR(expense.date)', 'ASC')
      .addOrderBy('MONTH(expense.date)', 'ASC')
      .getRawMany();
    const costs = expensesGroupByMonth.map((e) => e.sum);
    const labels = expensesGroupByMonth.map((e) => {
      return this.datesService.getMonthString(e.month);
    });
    const previosExpenses = costs.slice(0);
    previosExpenses.pop();

    const previosAverage = this.calculateAverage(previosExpenses);
    return {
      graph: costs,
      labels,
      data: expensesGroupByMonth,
      average: this.calculateAverage(costs),
      previosAverage,
    };
  }

  async findAllFromSubcategory(userId: number, subcategoryId: number, query) {
    const queryDate = query ? query.date : null;
    return this.expensesRepository.find({
      where: {
        userId,
        subcategoryId,
        date: Between(
          this.datesService.startMonth(queryDate),
          this.datesService.endMonth(queryDate),
        ),
      },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    return this.expensesRepository.findOne({
      where: { id },
      relations: ['subcategories', 'subcategories.category'],
    });
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.expensesRepository.findOne({where: {id: id}});
    if (!expense) throw new NotFoundException();
    const editExpense = Object.assign(expense, updateExpenseDto);
    return this.expensesRepository.save(editExpense);
  }

  async remove(id: number) {
    return this.expensesRepository.delete(id);
  }

  async findLast(userId: number, query) {
    const take = query.take || 5;
    const page = query.page || 1;
    const searchValue = query.query || '';
    const skip = (page - 1) * take;

    const result = await this.expensesRepository
      .createQueryBuilder('expense')
      .andWhere('expense.user_id = :userId', { userId })
      .leftJoinAndSelect(
        'subcategory',
        'subcategory',
        'subcategory.id = expense.subcategory_id',
      )
      .leftJoinAndSelect(
        'categories',
        'categories',
        'categories.id = subcategory.category_id',
      )
      .andWhere(
        new Brackets((qb) => {
          if (searchValue) {
            qb.where('expense.cost like :searchValue', {
              searchValue: `%${searchValue}%`,
            })
              .orWhere('expense.commentary like :searchValue', {
                searchValue: `%${searchValue}%`,
              })
              .orWhere('subcategory.name like :searchValue', {
                searchValue: `%${searchValue}%`,
              });
          } else {
            qb.where('expense.user_id = :userId', {
              userId,
            });
          }
        }),
      )
      .orderBy('expense.id', 'DESC')
      .offset(skip)
      .limit(take)
      .getRawMany();
    const dataTrasform = result.map((e) => {
      return {
        id: e.expense_id,
        createdAt: e.expense_created_at,
        cost: e.expense_cost,
        commentary: e.expense_commentary,
        date: e.expense_date,
        dateFormat: this.datesService.getFormatDate(e.expense_date),
        category: e.categories_name,
        iconCategory: e.categories_icon,
        subcategory: e.subcategory_name,
      };
    });
    return {
      data: dataTrasform,
    };
  }

  async findLastMonthsFromSubcategory(
    userId: number,
    subcategoryId: number,
    query: { numMonths: number },
  ) {
    const numMonths = query.numMonths || 6;
    const expensesOfSubcategoryGroupByMonth = await this.expensesRepository
      .createQueryBuilder('expense')
      .select(['MONTH(expense.date) as month', 'YEAR(expense.date) as year'])
      .addSelect('SUM(expense.cost)', 'sum')
      .where('expense.date >= :mydate', {
        mydate: this.datesService.monthAgo(numMonths),
      })
      .andWhere('expense.user_id = :userId', { userId })
      .andWhere('expense.subcategory_id = :subcategoryId', { subcategoryId })
      .groupBy('MONTH(expense.date)')
      .addGroupBy('YEAR(expense.date)')
      .orderBy('YEAR(expense.date)', 'ASC')
      .addOrderBy('MONTH(expense.date)', 'ASC')
      .getRawMany();
    const arrayIdxMonths =
      this.datesService.getPreviosMonthsLabelsIndex(numMonths);
    const expenses = [];
    arrayIdxMonths.index.forEach((element) => {
      const found = expensesOfSubcategoryGroupByMonth.some(
        (a) => a.month == element,
      );
      if (found) {
        let myCost = 0;
        expensesOfSubcategoryGroupByMonth.map((e) => {
          if (e.month === element) {
            myCost = e.sum;
          }
        });
        expenses.push(myCost);
      } else {
        expenses.push(0);
      }
    });
    const previosExpenses = expenses.slice(0);
    previosExpenses.pop();
    const average = this.calculateAverage(expenses);
    const previosAverage = this.calculateAverage(previosExpenses);
    const sum = expenses.reduce((acu, val) => {
      return acu + parseFloat(val);
    }, 0);

    return {
      graph: expenses,
      labels: arrayIdxMonths.labels,
      data: expensesOfSubcategoryGroupByMonth,
      average,
      previosAverage,
      sum,
    };
  }

  async findLastMonthsFromOnlyCategory(
    userId: number,
    categoryId: number,
    query: { numMonths: number },
  ) {
    const numMonths = query.numMonths || 6;
    const expensesGroupByMonth = await this.expensesRepository
      .createQueryBuilder('expense')
      .select(['MONTH(expense.date) as month', 'YEAR(expense.date) as year'])
      .leftJoin('expense.subcategoryId', 'subcategory')
      .addSelect('SUM(expense.cost)', 'sum')
      .where('expense.date >= :mydate', {
        mydate: this.datesService.monthAgo(numMonths),
      })
      .andWhere('expense.user_id = :userId', { userId })
      .andWhere('subcategory.category_id = :categoryId', { categoryId })
      .groupBy('MONTH(expense.date)')
      .addGroupBy('YEAR(expense.date)')
      .orderBy('YEAR(expense.date)', 'ASC')
      .addOrderBy('MONTH(expense.date)', 'ASC')
      .getRawMany();
    const arrayIdxMonths =
      this.datesService.getPreviosMonthsLabelsIndex(numMonths);
    const expenses = [];
    arrayIdxMonths.index.forEach((element) => {
      const found = expensesGroupByMonth.some((a) => a.month == element);
      if (found) {
        let myCost = 0;
        expensesGroupByMonth.map((e) => {
          if (e.month === element) {
            myCost = e.sum;
          }
        });
        expenses.push(myCost);
      } else {
        expenses.push(0);
      }
    });
    const previosExpenses = expenses.slice(0);
    previosExpenses.pop();
    const average = this.calculateAverage(expenses);
    const previosAverage = this.calculateAverage(previosExpenses);
    return {
      graph: expenses,
      labels: arrayIdxMonths.labels,
      average,
      previosAverage,
    };
  }

  calculateAverage(costs: any[]): number {
    const sum = costs.reduce((acu, val) => {
      return acu + parseFloat(val);
    }, 0);
    return costs.length > 0 ? sum / costs.length : 0;
  }

  async findAllDownload(userId: number, res) {
    const data = await this.expensesRepository
      .createQueryBuilder('expense')
      .andWhere('expense.user_id = :userId', { userId })
      .leftJoinAndSelect(
        'subcategory',
        'subcategory',
        'subcategory.id = expense.subcategory_id',
      )
      .leftJoinAndSelect(
        'categories',
        'categories',
        'categories.id = subcategory.category_id',
      )
      .orderBy('expense.id', 'DESC')
      .getRawMany();
    const fields = [
      {
        label: 'id',
        value: 'expense_id',
      },
      {
        label: 'cost',
        value: 'expense_cost',
      },
      {
        label: 'category',
        value: 'categories_name',
      },
      {
        label: 'subcategory',
        value: 'subcategory_name',
      },
      {
        label: 'created at',
        value: 'expense_created_at',
      },
      {
        label: 'date',
        value: 'expense_date',
      },
    ];

    return downloadResourceCsv(res, 'expenses.csv', fields, data);
  }
}
