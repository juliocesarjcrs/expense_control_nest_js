import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  endMonth,
  monthAgo,
  startMonth,
  getMonthString,
} from 'src/utils/dates/date';
import { Between, Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
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
      .where('expense.date >= :mydate', { mydate: monthAgo() })
      .andWhere('expense.user_id = :userId', { userId })
      .groupBy('MONTH(expense.date)')
      .getRawMany();

    const costs = expensesGroupByMonth.map((e) => e.sum);
    const labels = expensesGroupByMonth.map((e) => {
      return getMonthString(e.month);
    });
    return { graph: costs, labels, data: expensesGroupByMonth };
  }

  async findAllFromSubcategory(userId: number, subcategoryId: number, query) {
    const queryDate = query ? query.date : null;
    return this.expensesRepository.find({
      where: {
        userId,
        subcategoryId,
        date: Between(startMonth(queryDate), endMonth(queryDate)),
      },
      order: { id: 'DESC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} expense`;
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
}
