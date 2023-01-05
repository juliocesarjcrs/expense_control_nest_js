import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExpensesService } from 'src/expenses/expenses.service';
import { IncomesService } from 'src/incomes/incomes.service';
import { Repository } from 'typeorm';
import { CreateSavingDto } from './dto/create-saving.dto';
import { Saving } from './entities/saving.entity';
import { DatesService } from 'src/utils/dates/dates.service';

@Injectable()
export class SavingService {
  constructor(
    @InjectRepository(Saving)
    private SavingRepository: Repository<Saving>,
    private incomesService: IncomesService,
    private expenseService: ExpensesService,
    private datesService: DatesService,
  ) {}

  create(createSavingDto: CreateSavingDto): Promise<Saving> {
    const SavingEntity = new Saving();
    SavingEntity.saving = createSavingDto.saving;
    SavingEntity.expense = createSavingDto.expense;
    SavingEntity.income = createSavingDto.income;
    SavingEntity.date = createSavingDto.date;
    SavingEntity.userId = createSavingDto.userId;
    SavingEntity.commentary = createSavingDto.commentary;
    return this.SavingRepository.save(SavingEntity);
  }

  async findAll(userId: number, query: { numMonths: number }) {
    const numMonths = query.numMonths || 4;
    const savingsByuser = await this.SavingRepository.createQueryBuilder(
      'saving',
    )
      .where('saving.user_id = :userId', { userId })
      .orderBy('YEAR(saving.date)', 'ASC')
      .addOrderBy('MONTH(saving.date)', 'ASC')
      .getMany();
    const expenses = savingsByuser.map((e) => e.expense);
    const incomes = savingsByuser.map((e) => e.income);
    const savings = savingsByuser.map((e) => e.saving);
    const labels = savingsByuser.map(
      (e) => this.datesService.getFormatDate(e.date, 'MMMM-YYYY')
    );
    return {
      data: savingsByuser,
      graph: {
        labels,
        expenses,
        incomes,
        savings,
      },
    };
  }
  async updateAllByUser(userId: number, query: { numMonths: number }) {
    const numMonths = query.numMonths || 4;
    const { data: dataIncomes }: { data: any } =
      await this.incomesService.findAll(userId, query);
    const { data: dataExpenses }: { data: any } =
      await this.expenseService.findAll(userId, query);
    const { fullDate } =
      this.datesService.getPreviosMonthsLabelsIndex(numMonths);
    const savingInsert = [];
    const { data: savingsByUser } = await this.findAll(userId, query);
    fullDate.forEach((element) => {
      const savingRow = new Saving();
      const idSaving = this.hasId(savingsByUser, element.date);
      if (idSaving) {
        savingRow.id = idSaving;
      }
      savingRow.date = element.date;
      savingRow.userId = userId;
      savingRow.income = this.getValueByDate(dataIncomes, element);
      savingRow.expense = this.getValueByDate(dataExpenses, element);
      savingRow.saving = savingRow.income - savingRow.expense;
      savingInsert.push(savingRow);
    });
    let result = null;
    try {
      result = await this.SavingRepository.createQueryBuilder()
        .insert()
        .into('saving')
        .values(savingInsert)
        .orUpdate(['saving', 'income','expense'], ['user_id'], {
          skipUpdateIfNoValuesChanged: true,
        })
        .execute();
    } catch (error) {
      console.log('error', error);
    }

    return {
      result,
    };
  }

  getValueByDate(data, element): number {
    const found = data.some(
      (a) => a.month === element.month && a.year === element.year,
    );
    if (found) {
      let myCost = 0;
      data.map((e) => {
        if (e.month === element.month && e.year === element.year) {
          myCost = parseFloat(e.sum);
        }
      });
      return myCost;
    } else {
      return 0;
    }
  }

  hasId(savingsByUser, date: Date): number {
    const found = savingsByUser.some((a) => a.date === date);
    if (found) {
      let idSaving = 0;
      savingsByUser.map((e) => {
        if (e.date === date) {
          idSaving = e.id;
        }
      });
      return idSaving;
    } else {
      return 0;
    }
  }
}
