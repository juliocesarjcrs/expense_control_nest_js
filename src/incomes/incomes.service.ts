import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatesService } from 'src/utils/dates/dates.service';
import { Repository } from 'typeorm';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { Income } from './entities/income.entity';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private IncomeRepository: Repository<Income>,
    private datesService: DatesService,
  ) {}

  create(createIncomeDto: CreateIncomeDto): Promise<Income> {
    const IncomeEntity = new Income();
    IncomeEntity.amount = createIncomeDto.amount;
    IncomeEntity.date = createIncomeDto.date;
    IncomeEntity.userId = createIncomeDto.userId;
    IncomeEntity.categoryId = createIncomeDto.categoryId;
    IncomeEntity.commentary = createIncomeDto.commentary;
    return this.IncomeRepository.save(IncomeEntity);
  }

  async findAll(userId: number, query: { numMonths: number }) {
    const numMonths = query.numMonths || 4;
    const incomesGroupByMonth = await this.IncomeRepository.createQueryBuilder(
      'income',
    )
      .select('MONTH(income.date) as month')
      .addSelect('SUM(income.amount)', 'sum')
      .where('income.date >= :mydate', {
        mydate: this.datesService.monthAgo(numMonths),
      })
      .andWhere('income.user_id = :userId', { userId })
      .groupBy('MONTH(income.date)')
      .addGroupBy('YEAR(income.date)')
      .orderBy('YEAR(income.date)', 'ASC')
      .addOrderBy('MONTH(income.date)', 'ASC')
      .getRawMany();

    const costs = incomesGroupByMonth.map((e) => e.sum);
    const previosExpenses = costs.slice(0);
    previosExpenses.pop();

    const previosAverage = this.calculateAverage(previosExpenses);

    return {
      incomes: costs,
      data: incomesGroupByMonth,
      average: this.calculateAverage(costs),
      previosAverage,
    };
  }

  calculateAverage(costs: any[]): number {
    const sum = costs.reduce((acu, val) => {
      return acu + parseFloat(val);
    }, 0);
    return costs.length > 0 ? sum / costs.length : 0;
  }

  async findOne(id: number): Promise<Income> {
    const income = await this.IncomeRepository.findOne(id);
    if (!income)
      throw new HttpException('Income not found', HttpStatus.BAD_REQUEST);
    return income;
  }

  async update(id: number, updateIncomeDto: UpdateIncomeDto) {
    const income = await this.IncomeRepository.findOne(id);
    if (!income)
      throw new HttpException('Income not found', HttpStatus.BAD_REQUEST);
    const editExpense = Object.assign(income, updateIncomeDto);
    return this.IncomeRepository.save(editExpense);
  }

  async remove(id: number) {
    const response = await this.IncomeRepository.delete(id);
    if (response.affected <= 0)
      throw new HttpException('Income not found', HttpStatus.BAD_REQUEST);
    return response;
  }
}
