import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatesService } from 'src/utils/dates/dates.service';
import { Between, Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

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

  async findAll(userId: number) {
    const expensesGroupByMonth = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('MONTH(expense.date) as month')
      .addSelect('SUM(expense.cost)', 'sum')
      .where('expense.date >= :mydate', {
        mydate: this.datesService.monthAgo(),
      })
      .andWhere('expense.user_id = :userId', { userId })
      .groupBy('MONTH(expense.date)')
      .getRawMany();

    const costs = expensesGroupByMonth.map((e) => e.sum);
    const labels = expensesGroupByMonth.map((e) => {
      return this.datesService.getMonthString(e.month);
    });
    return { graph: costs, labels, data: expensesGroupByMonth };
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

  findOne(id: number) {
    return this.expensesRepository.findOne({
      where: { id },
      relations: ['subcategoryId', 'subcategoryId.categoryId'],
    });
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.expensesRepository.findOne(id);
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
    const skip = (page - 1) * take;
    const [result, total] = await this.expensesRepository.findAndCount({
      relations: ['subcategoryId', 'subcategoryId.categoryId'],
      where: { userId: userId },
      order: { id: 'DESC' },
      take,
      skip,
    });

    const dataTrasform = result.map((e) => {
      return {
        id: e.id,
        createdAt: e.createdAt,
        cost: e.cost,
        commentary: e.commentary,
        date: e.date,
        category: e.subcategoryId.categoryId.name,
        iconCategory: e.subcategoryId.categoryId.icon,
        subcategory: e.subcategoryId.name,
      };
    });
    return {
      data: dataTrasform,
      count: total,
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
      .select('MONTH(expense.date) as month')
      .addSelect('SUM(expense.cost)', 'sum')
      .where('expense.date >= :mydate', {
        mydate: this.datesService.monthAgo(numMonths),
      })
      .andWhere('expense.user_id = :userId', { userId })
      .andWhere('expense.subcategory_id = :subcategoryId', { subcategoryId })
      .groupBy('MONTH(expense.date)')
      .orderBy('month')
      .getRawMany();
    const costs = expensesOfSubcategoryGroupByMonth.map((e) =>
      parseFloat(e.sum),
    );
    const labels = expensesOfSubcategoryGroupByMonth.map((e) => {
      return this.datesService.getMonthString(e.month);
    });
    const average = this.calculateAverage(costs);
    return {
      graph: costs,
      labels,
      data: expensesOfSubcategoryGroupByMonth,
      average,
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
      .select('MONTH(expense.date) as month')
      .leftJoin('expense.subcategoryId', 'subcategory')
      .addSelect('SUM(expense.cost)', 'sum')
      .where('expense.date >= :mydate', {
        mydate: this.datesService.monthAgo(numMonths),
      })
      .andWhere('expense.user_id = :userId', { userId })
      .andWhere('subcategory.category_id = :categoryId', { categoryId })
      .groupBy('MONTH(expense.date)')
      .orderBy('month')
      .getRawMany();
    const costs = expensesGroupByMonth.map((e) => parseFloat(e.sum));
    const labels = expensesGroupByMonth.map((e) => {
      return this.datesService.getMonthString(e.month);
    });
    const average = this.calculateAverage(costs);
    return { graph: costs, labels, average };
  }

  calculateAverage(costs: any[]): number {
    const sum = costs.reduce((acu, val) => {
      return acu + val;
    }, 0);
    const average = costs.length > 0 ? sum / costs.length : 0;
    return average;
  }
}
