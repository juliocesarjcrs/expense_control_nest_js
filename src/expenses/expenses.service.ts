import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    return await this.expensesRepository.save(ExpenseEntity);
  }

  async findAll(userId: number) {
    return this.expensesRepository.find({ where: { userId: userId } });
  }

  findOne(id: number) {
    return `This action returns a #${id} expense`;
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.expensesRepository.findOne(id);

    if (!expense) throw new NotFoundException();

    const editExpense = Object.assign(expense, updateExpenseDto);
    console.log('editExpense', editExpense);
    return await this.expensesRepository.save(editExpense);
  }

  async remove(id: number) {
    return this.expensesRepository.delete(id);
  }
}
