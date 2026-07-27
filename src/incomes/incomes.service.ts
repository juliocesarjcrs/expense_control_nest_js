import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { DatesService } from 'src/utils/dates/dates.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { Income } from './entities/income.entity';
import {
  FindLastQueryParams,
  NumMonthsQueryParams,
} from './interfaces/income-query-params.interface';
import { IncomeSearchOptions } from './interfaces/income-search-options.interface';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
    private datesService: DatesService,
  ) {}

  create(createIncomeDto: CreateIncomeDto): Promise<Income> {
    const incomeEntity = new Income();
    incomeEntity.amount = createIncomeDto.amount;
    incomeEntity.date = createIncomeDto.date;
    incomeEntity.userId = createIncomeDto.userId;
    incomeEntity.categoryId = createIncomeDto.categoryId;
    incomeEntity.commentary = createIncomeDto.commentary ?? null;
    return this.incomeRepository.save(incomeEntity);
  }

  async findAll(userId: number, query: NumMonthsQueryParams) {
    const numMonths = Number(query.numMonths) || 4;
    const incomesGroupByMonth = await this.incomeRepository
      .createQueryBuilder('income')
      .select(['MONTH(income.date) as month', 'YEAR(income.date) as year'])
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
    const previosIncomes = costs.slice(0);
    previosIncomes.pop();

    const previosAverage = this.calculateAverage(previosIncomes);

    return {
      incomes: costs,
      data: incomesGroupByMonth,
      average: this.calculateAverage(costs),
      previosAverage,
    };
  }

  calculateAverage(costs: Array<number | string>): number {
    const sum = costs.reduce<number>((acc, value) => acc + Number(value), 0);

    return costs.length > 0 ? sum / costs.length : 0;
  }

  async findOne(id: number): Promise<Income> {
    const income = await this.incomeRepository.findOne({ where: { id } });
    if (!income) {
      throw new NotFoundException(`Income with id ${id} not found`);
    }
    return income;
  }

  async findLast(userId: number, query: FindLastQueryParams) {
    const take = Number(query.take) || 5;
    const page = Number(query.page) || 1;
    const searchValue = query.query ?? '';
    const skip = (page - 1) * take;
    const result = await this.incomeRepository
      .createQueryBuilder('income')
      .andWhere('income.user_id = :userId', { userId })
      .leftJoinAndSelect(
        'categories',
        'categories',
        'categories.id = income.category_id',
      )
      .andWhere(
        new Brackets((qb) => {
          if (searchValue) {
            qb.where('income.amount like :searchValue', {
              searchValue: `%${searchValue}%`,
            })
              .orWhere('income.commentary like :searchValue', {
                searchValue: `%${searchValue}%`,
              })
              .orWhere('categories.name like :searchValue', {
                searchValue: `%${searchValue}%`,
              });
          } else {
            qb.where('income.user_id = :userId', {
              userId,
            });
          }
        }),
      )
      .orderBy('income.id', 'DESC')
      .offset(skip)
      .limit(take)
      .getRawMany();

    const dataTransform = result.map((e) => ({
      id: e.income_id,
      createdAt: e.income_created_at,
      cost: e.income_amount,
      commentary: e.income_commentary,
      date: e.income_date,
      dateFormat: this.datesService.getFormatDate(e.income_date),
      category: e.categories_name,
      idCategory: e.categories_id,
      iconCategory: e.categories_icon,
    }));

    return {
      data: dataTransform,
    };
  }

  async update(id: number, updateIncomeDto: UpdateIncomeDto) {
    const income = await this.incomeRepository.findOne({ where: { id } });
    if (!income) {
      throw new NotFoundException(`Income with id ${id} not found`);
    }
    const editIncome = Object.assign(income, updateIncomeDto);
    return this.incomeRepository.save(editIncome);
  }

  async remove(id: number) {
    const response = await this.incomeRepository.delete(id);
    if (response.affected === 0) {
      throw new NotFoundException(`Income with id ${id} not found`);
    }
    return response;
  }

  async findLastMonthsFromOnlyCategory(
    userId: number,
    categoryId: number,
    query: NumMonthsQueryParams,
  ) {
    const numMonths = Number(query.numMonths) || 6;
    const incomesGroupByMonth = await this.incomeRepository
      .createQueryBuilder('income')
      .select(['MONTH(income.date) as month', 'YEAR(income.date) as year'])
      .leftJoin('income.category', 'category')
      .addSelect('SUM(income.amount)', 'sum')
      .where('income.date >= :mydate', {
        mydate: this.datesService.monthAgo(numMonths),
      })
      .andWhere('income.user_id = :userId', { userId })
      .andWhere('category.id = :categoryId', { categoryId })
      .groupBy('MONTH(income.date)')
      .addGroupBy('YEAR(income.date)')
      .orderBy('YEAR(income.date)', 'ASC')
      .addOrderBy('MONTH(income.date)', 'ASC')
      .getRawMany();
    const { fullDate, labels } =
      this.datesService.getPreviosMonthsLabelsIndex(numMonths);
    const incomes: number[] = [];
    fullDate.forEach((element) => {
      const found = incomesGroupByMonth.some(
        (a) => a.month === element.month && a.year === element.year,
      );
      if (found) {
        let myCost = 0;
        incomesGroupByMonth.forEach((e) => {
          if (e.month === element.month && e.year === element.year) {
            myCost = parseFloat(e.sum);
          }
        });
        incomes.push(myCost);
      } else {
        incomes.push(0);
      }
    });
    const previosIncomes = incomes.slice(0);
    previosIncomes.pop();
    const average = this.calculateAverage(incomes);
    const previosAverage = this.calculateAverage(previosIncomes);
    const sum = incomes.reduce((accu, val) => accu + val, 0);
    return {
      graph: incomes,
      labels,
      average,
      previosAverage,
      sum,
    };
  }

  async findIncomesByCategoryId(
    userId: number,
    categoryId: number,
    options: IncomeSearchOptions = {},
  ) {
    const query = this.incomeRepository.createQueryBuilder('income');
    query.where('income.categoryId = :categoryId', { categoryId });
    query.andWhere('income.user_id = :userId', { userId });

    const { startDate, endDate, searchValue, orderBy, order } = options;

    if (startDate) {
      const startDateFormat = this.datesService.getFormatDate(startDate);
      query.andWhere('income.date >= :startDateFormat', { startDateFormat });
    }

    if (endDate) {
      const endDateFormat = this.datesService.getFormatDate(endDate);
      query.andWhere('income.date <= :endDateFormat', { endDateFormat });
    }

    if (searchValue) {
      query.andWhere(
        '(income.amount LIKE :searchValue OR income.commentary LIKE :searchValue)',
        { searchValue: `%${searchValue}%` },
      );
    }

    if (orderBy && order) {
      query.orderBy(`income.${orderBy}`, order);
    }

    const incomes = await query.getMany();
    const sumIncomes = incomes.reduce((accu, val) => accu + val.amount, 0);

    return { incomes, sum: sumIncomes };
  }
}
