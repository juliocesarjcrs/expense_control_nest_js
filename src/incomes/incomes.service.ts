import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatesService } from 'src/utils/dates/dates.service';
import { Repository, Brackets } from 'typeorm';
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

  async findLast(userId: number, query) {
    const take = query.take || 5;
    const page = query.page || 1;
    const searchValue = query.query || '';
    const skip = (page - 1) * take;
    const result = await this.IncomeRepository.createQueryBuilder('income')
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
    const dataTrasform = result.map((e) => {
      return {
        id: e.income_id,
        createdAt: e.income_created_at,
        cost: e.income_amount,
        commentary: e.income_commentary,
        date: e.income_date,
        dateFormat: this.datesService.getFormatDate(e.income_date),
        category: e.categories_name,
        idCategory: e.categories_id,
        iconCategory: e.categories_icon,
      };
    });
    return {
      data: dataTrasform,
    };
  }

  async update(id: number, updateIncomeDto: UpdateIncomeDto) {
    const income = await this.IncomeRepository.findOne(id);
    if (!income)
      throw new HttpException('Income not found', HttpStatus.BAD_REQUEST);
    const editIncome = Object.assign(income, updateIncomeDto);
    return this.IncomeRepository.save(editIncome);
  }

  async remove(id: number) {
    const response = await this.IncomeRepository.delete(id);
    if (response.affected <= 0)
      throw new HttpException('Income not found', HttpStatus.BAD_REQUEST);
    return response;
  }

  async findLastMonthsFromOnlyCategory(
    userId: number,
    categoryId: number,
    query: { numMonths: number },
  ) {
    const numMonths = query.numMonths || 6;
    const incomesGroupByMonth = await this.IncomeRepository.createQueryBuilder(
      'income',
    )
      .select(['MONTH(income.date) as month', 'YEAR(income.date) as year'])
      .leftJoin('income.categoryId', 'category')
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
    const arrayIdxMonths =
      this.datesService.getPreviosMonthsLabelsIndex(numMonths);
    const incomes = [];
    arrayIdxMonths.index.forEach((element) => {
      const found = incomesGroupByMonth.some((a) => a.month == element);
      if (found) {
        let myCost = 0;
        incomesGroupByMonth.forEach((e) => {
          if (e.month === element) {
            myCost = e.sum;
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
    const sum = incomes.reduce((acu, val) => {
      return acu + parseFloat(val);
    }, 0);
    return {
      graph: incomes,
      labels: arrayIdxMonths.labels,
      average,
      previosAverage,
      sum,
    };
  }
}
