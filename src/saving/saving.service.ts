import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExpensesService } from 'src/expenses/expenses.service';
import { IncomesService } from 'src/incomes/incomes.service';
import { Between, Repository } from 'typeorm';
import { CreateSavingDto } from './dto/create-saving.dto';
import { Saving } from './entities/saving.entity';
import { DatesService } from 'src/utils/dates/dates.service';
import { SavingsPeriodAnalysisDto } from './dto/savings-period-analysis.dto';

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

  async findAll(userId: number) {
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
    const labels = savingsByuser.map((e) =>
      this.datesService.getFormatDate(e.date, 'MMMM-YYYY'),
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
    const { data: savingsByUser } = await this.findAll(userId);
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
        .orUpdate(['saving', 'income', 'expense'], ['user_id'], {
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

  async getPeriodAnalysis(userId: number, query: SavingsPeriodAnalysisDto) {
    const { startDate, endDate, compareWithPrevious } = query;

    const periodSavings = await this.findSavingsByPeriod(
      userId,
      startDate,
      endDate,
    );

    if (periodSavings.length === 0) {
      return this.getEmptyAnalysisResponse();
    }

    const periodData = this.calculatePeriodData(periodSavings);
    const monthlyBreakdown = this.buildMonthlyBreakdown(periodSavings);
    const trend = this.calculateTrend(periodSavings);

    let comparison = undefined;
    if (compareWithPrevious) {
      comparison = await this.calculateComparison(
        userId,
        startDate,
        endDate,
        periodData,
      );
    }

    return {
      periodData,
      monthlyBreakdown,
      trend,
      comparison,
    };
  }

  // ==========================================
  // MÉTODOS PRIVADOS PARA PERIOD ANALYSIS
  // ==========================================

  private async findSavingsByPeriod(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<Saving[]> {
    // Extraer solo la parte DATE (YYYY-MM-DD) para comparación correcta
    // Esto maneja tanto "2025-01-01" como "2025-01-01T23:38:00.000Z"
    const startDateOnly = startDate.split('T')[0];
    const endDateOnly = endDate.split('T')[0];

    return this.SavingRepository.createQueryBuilder('saving')
      .where('saving.user_id = :userId', { userId })
      .andWhere('DATE(saving.date) >= :startDate', { startDate: startDateOnly })
      .andWhere('DATE(saving.date) <= :endDate', { endDate: endDateOnly })
      .orderBy('saving.date', 'ASC')
      .getMany();
  }

  private getEmptyAnalysisResponse() {
    return {
      periodData: {
        totalSaving: 0,
        totalIncome: 0,
        totalExpense: 0,
        avgMonthlySaving: 0,
        savingPercentage: 0,
        monthsCount: 0,
      },
      monthlyBreakdown: [],
      trend: {
        direction: 'stable' as const,
        percentage: 0,
      },
    };
  }

  private calculatePeriodData(periodSavings: Saving[]) {
    const totalSaving = this.sumField(periodSavings, 'saving');
    const totalIncome = this.sumField(periodSavings, 'income');
    const totalExpense = this.sumField(periodSavings, 'expense');
    const monthsCount = periodSavings.length;
    const avgMonthlySaving = totalSaving / monthsCount;
    const savingPercentage = this.calculatePercentage(totalSaving, totalIncome);

    return {
      totalSaving,
      totalIncome,
      totalExpense,
      avgMonthlySaving: parseFloat(avgMonthlySaving.toFixed(2)),
      savingPercentage: parseFloat(savingPercentage.toFixed(2)),
      monthsCount,
    };
  }

  private buildMonthlyBreakdown(periodSavings: Saving[]) {
    return periodSavings.map((s) => {
      const monthIncome = s.income || 0;
      const monthSavingPercentage = this.calculatePercentage(
        s.saving,
        monthIncome,
      );

      // Convertir a Date si viene como string
      const dateObj = s.date instanceof Date ? s.date : new Date(s.date);

      return {
        id: s.id,
        month: this.datesService.getFormatDate(s.date, 'MMM YYYY'),
        date: dateObj.toISOString(),
        saving: s.saving,
        income: s.income,
        expense: s.expense,
        savingPercentage: parseFloat(monthSavingPercentage.toFixed(2)),
      };
    });
  }

  private calculateTrend(periodSavings: Saving[]) {
    const monthsCount = periodSavings.length;

    if (monthsCount < 2) {
      return { direction: 'stable' as const, percentage: 0 };
    }

    const midPoint = Math.floor(monthsCount / 2);
    const firstHalf = periodSavings.slice(0, midPoint);
    const secondHalf = periodSavings.slice(midPoint);

    const avgFirstHalf = this.calculateAverage(firstHalf, 'saving');
    const avgSecondHalf = this.calculateAverage(secondHalf, 'saving');

    const trendPercentage = this.calculateChangePercentage(
      avgFirstHalf,
      avgSecondHalf,
    );

    return {
      direction: this.getTrendDirection(trendPercentage),
      percentage: parseFloat(trendPercentage.toFixed(2)),
    };
  }

  private async calculateComparison(
    userId: number,
    startDate: string,
    endDate: string,
    currentPeriodData: any,
  ) {
    const { previousStart, previousEnd } = this.getPreviousPeriodDates(
      startDate,
      endDate,
    );

    const previousSavings = await this.findSavingsByPeriod(
      userId,
      previousStart.toISOString(),
      previousEnd.toISOString(),
    );

    if (previousSavings.length === 0) {
      return undefined;
    }

    const prevTotalSaving = this.sumField(previousSavings, 'saving');
    const prevTotalIncome = this.sumField(previousSavings, 'income');
    const prevAvgMonthlySaving = prevTotalSaving / previousSavings.length;
    const prevSavingPercentage = this.calculatePercentage(
      prevTotalSaving,
      prevTotalIncome,
    );

    const difference = currentPeriodData.totalSaving - prevTotalSaving;
    const percentageChange = this.calculateChangePercentage(
      prevTotalSaving,
      currentPeriodData.totalSaving,
    );

    return {
      previousPeriod: {
        totalSaving: prevTotalSaving,
        avgMonthlySaving: prevAvgMonthlySaving,
        savingPercentage: parseFloat(prevSavingPercentage.toFixed(2)),
      },
      difference,
      percentageChange: parseFloat(percentageChange.toFixed(2)),
    };
  }

  // ==========================================
  // MÉTODOS UTILITARIOS
  // ==========================================

  private sumField(data: Saving[], field: keyof Saving): number {
    return data.reduce((sum, item) => sum + (item[field] as number), 0);
  }

  private calculateAverage(data: Saving[], field: keyof Saving): number {
    if (data.length === 0) return 0;
    const sum = this.sumField(data, field);
    return sum / data.length;
  }

  private calculatePercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  private calculateChangePercentage(
    oldValue: number,
    newValue: number,
  ): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  }

  private getTrendDirection(percentage: number): 'up' | 'down' | 'stable' {
    if (percentage > 5) return 'up';
    if (percentage < -5) return 'down';
    return 'stable';
  }

  private getPreviousPeriodDates(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }

    const periodDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - periodDays);

    const previousEnd = new Date(start);
    previousEnd.setDate(previousEnd.getDate() - 1);

    return { previousStart, previousEnd };
  }
}
