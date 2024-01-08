import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Budget } from './entities/budget.entity';
import { Repository } from 'typeorm';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
  ) {}

  async createBudgets(budgets: CreateBudgetDto[]): Promise<Budget[]> {
    const createdBudgets = await this.budgetRepository.save(budgets);
    return createdBudgets;
  }

  async findAll(userId: number, query: {
    year: number,
    city: string
  }) {
    const year = query.year;
    const city = query.city;
    const budgetByuser = await this.budgetRepository.createQueryBuilder(
      'budget',
    )
      .where('budget.user_id = :userId', { userId })
      .andWhere('budget.year = :year', { year })
      .andWhere('budget.city = :city', { city })
      .getMany();
    return {
      data: budgetByuser,
    };
  }
}
