import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatesService } from 'src/utils/dates/dates.service';
import { Between, Brackets, Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';
import { downloadResourceCsv } from 'src/utils/helpers/file-helper';
import { ExpenseSearchOptionsDto } from './dto/expense-search-options.dto';
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

  async createMany(expenses: CreateExpenseDto[]) {
    // Usamos un transaction para asegurar la atomicidad
    return this.expensesRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const createdExpenses = [];

        for (const expense of expenses) {
          const expenseEntity = new Expense();
          expenseEntity.userId = expense.userId;
          expenseEntity.subcategoryId = expense.subcategoryId;
          expenseEntity.cost = expense.cost;
          expenseEntity.commentary = expense.commentary;
          expenseEntity.date = expense.date;

          const savedExpense =
            await transactionalEntityManager.save(expenseEntity);
          createdExpenses.push(savedExpense);
        }

        return createdExpenses;
      },
    );
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
      return `${this.datesService.getMonthString(e.month)} ${e.year}`;
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
    const expense = await this.expensesRepository.findOne({
      where: { id: id },
    });
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
    const orderBy = query.orderBy || 'id';

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
      .orderBy(`expense.${orderBy}`, 'DESC')
      .addOrderBy('expense.id', 'DESC')
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
    arrayIdxMonths.fullDate.forEach((element) => {
      const found = expensesOfSubcategoryGroupByMonth.some(
        (a) => a.month === element.month && a.year === element.year,
      );
      if (found) {
        let myCost = 0;
        expensesOfSubcategoryGroupByMonth.map((e) => {
          if (e.month === element.month && e.year === element.year) {
            myCost = parseFloat(e.sum);
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
      .leftJoin('expense.subcategory', 'subcategory')
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
    arrayIdxMonths.fullDate.forEach((element) => {
      const found = expensesGroupByMonth.some(
        (a) => a.month === element.month && a.year === element.year,
      );
      if (found) {
        let myCost = 0;
        expensesGroupByMonth.map((e) => {
          if (e.month === element.month && e.year === element.year) {
            myCost = parseFloat(e.sum);
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
        label: 'commentary',
        value: 'expense_commentary',
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

  async findExpensesBySubcategories(
    userId: number,
    subcategoriesId: number[],
    options: ExpenseSearchOptionsDto,
  ) {
    const query = this.expensesRepository.createQueryBuilder('expense');
    query.select([
      'expense.id',
      'expense.cost',
      'expense.commentary',
      'expense.date',
      'expense.createdAt',
    ]);

    query.where('expense.user_id = :userId', { userId });

    if (subcategoriesId.length > 0) {
      query.andWhere('expense.subcategoryId IN (:...subcategoriesId)', {
        subcategoriesId,
      });
    }

    const { startDate, endDate, searchValue, orderBy, order } = options;

    if (startDate) {
      const startDateFormat = this.datesService.getFormatDate(startDate);
      query.andWhere('expense.date >= :startDateFormat', { startDateFormat });
    }

    if (endDate) {
      const endDateFormat = this.datesService.getFormatDate(endDate);
      query.andWhere('expense.date <= :endDateFormat', { endDateFormat });
    }

    if (searchValue) {
      query.andWhere(
        '(expense.cost LIKE :searchValue OR expense.commentary LIKE :searchValue)',
        { searchValue: `%${searchValue}%` },
      );
    }

    if (orderBy && order) {
      query.orderBy(`expense.${orderBy}`, order);
    }
    query.leftJoinAndSelect('expense.subcategory', 'subcategories');
    query.addSelect(['subcategories.id', 'subcategories.name']);

    const expenses = await query.getMany();
    const sumExpenses = expenses.reduce((acu, val) => acu + val.cost, 0);

    return { expenses, sum: sumExpenses };
  }

  async comparePeriods(
    userId: number,
    categories: { categoryId: number; subcategoriesId: number[] }[],
    periodA: { start: Date; end: Date },
    periodB: { start: Date; end: Date },
  ) {
    const allSubcategories = categories.flatMap((c) => c.subcategoriesId);

    const queryBase = this.expensesRepository.createQueryBuilder('expense');

    const buildQuery = (period: { start: Date; end: Date }) => {
      const query = queryBase.clone();

      query.select([
        'expense.id',
        'expense.cost',
        'expense.commentary',
        'expense.date',
        'expense.createdAt',
      ]);

      query.where('expense.user_id = :userId', { userId });

      if (allSubcategories.length > 0) {
        query.andWhere('expense.subcategoryId IN (:...subcategoriesId)', {
          subcategoriesId: allSubcategories,
        });
      }

      if (period.start) {
        const startDateFormat = this.datesService.getFormatDate(period.start);
        query.andWhere('expense.date >= :startDateFormat', { startDateFormat });
      }

      if (period.end) {
        const endDateFormat = this.datesService.getFormatDate(period.end);
        query.andWhere('expense.date <= :endDateFormat', { endDateFormat });
      }

      query.leftJoinAndSelect('expense.subcategory', 'subcategory');
      query.addSelect(['subcategory.id', 'subcategory.name']);

      return query;
    };

    const [expensesA, expensesB] = await Promise.all([
      buildQuery(periodA).getMany(),
      buildQuery(periodB).getMany(),
    ]);

    const sumA = expensesA.reduce((acu, val) => acu + val.cost, 0);
    const sumB = expensesB.reduce((acu, val) => acu + val.cost, 0);

    // Calcular número de meses en cada periodo
    const monthsA = this.calculateMonthsDifference(periodA.start, periodA.end);
    const monthsB = this.calculateMonthsDifference(periodB.start, periodB.end);

    // Promedios mensuales
    const avgMonthlyA = monthsA > 0 ? sumA / monthsA : 0;
    const avgMonthlyB = monthsB > 0 ? sumB / monthsB : 0;

    // Comparación total acumulado
    const totalDifference = sumB - sumA;
    const totalPercentageChange =
      sumA === 0 ? null : ((totalDifference / sumA) * 100).toFixed(2);

    // Comparación promedio mensual
    const avgDifference = avgMonthlyB - avgMonthlyA;
    const avgPercentageChange =
      avgMonthlyA === 0
        ? null
        : ((avgDifference / avgMonthlyA) * 100).toFixed(2);

    // Generar explicación
    const explanation = this.generateExplanation(
      totalDifference,
      totalPercentageChange,
      avgDifference,
      avgPercentageChange,
    );

    return {
      periodA: {
        range: { start: periodA.start, end: periodA.end },
        total: sumA,
        months: monthsA,
        averageMonthly: avgMonthlyA,
      },
      periodB: {
        range: { start: periodB.start, end: periodB.end },
        total: sumB,
        months: monthsB,
        averageMonthly: avgMonthlyB,
      },
      comparison: {
        total: {
          difference: totalDifference,
          percentageChange: totalPercentageChange,
          trend:
            totalDifference === 0
              ? 'equal'
              : totalDifference > 0
                ? 'increase'
                : 'decrease',
        },
        monthlyAverage: {
          difference: avgDifference,
          percentageChange: avgPercentageChange,
          trend:
            avgDifference === 0
              ? 'equal'
              : avgDifference > 0
                ? 'increase'
                : 'decrease',
        },
        explanation,
      },
      chartData: this.buildChartData(expensesA, expensesB),
    };
  }

  private calculateMonthsDifference(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();

    return yearDiff * 12 + monthDiff + 1; // +1 para incluir ambos meses
  }

  private generateExplanation(
    totalDifference: number,
    totalPercentage: string | null,
    avgDifference: number,
    avgPercentage: string | null,
  ): string {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(Math.abs(amount));

    let explanation = '';

    // Análisis de promedio mensual
    if (avgPercentage !== null) {
      const avgTrend = avgDifference > 0 ? 'aumentó' : 'disminuyó';
      explanation += `En promedio mensual, durante el Periodo B el gasto ${avgTrend} un ${Math.abs(
        parseFloat(avgPercentage),
      ).toFixed(1)}% (${formatCurrency(avgDifference)})`;
    }

    // Análisis de total acumulado
    if (totalPercentage !== null) {
      const totalTrend = totalDifference > 0 ? 'mayor' : 'menor';
      if (explanation) explanation += ', mientras que ';
      explanation += `el total acumulado del periodo fue ${Math.abs(
        parseFloat(totalPercentage),
      ).toFixed(1)}% ${totalTrend} (${formatCurrency(totalDifference)})`;
    }

    if (explanation) {
      explanation +=
        '. Ambos enfoques son válidos: el primero refleja la intensidad del gasto mensual y el segundo el gasto total de todos los meses analizados.';
    }

    return (
      explanation ||
      'No hay suficiente información para generar una comparación.'
    );
  }

  private buildChartData(expensesA: Expense[], expensesB: Expense[]) {
    // Agrupar por nombre de subcategoría
    const sumBySubcategory = (expenses: Expense[]) => {
      return expenses.reduce<Record<string, number>>((acc, exp) => {
        const name = exp.subcategory?.name ?? 'Sin subcategoría';
        acc[name] = (acc[name] || 0) + exp.cost;
        return acc;
      }, {});
    };

    const sumsA = sumBySubcategory(expensesA);
    const sumsB = sumBySubcategory(expensesB);

    const labels = Array.from(
      new Set([...Object.keys(sumsA), ...Object.keys(sumsB)]),
    );

    const dataA = labels.map((label) => sumsA[label] || 0);
    const dataB = labels.map((label) => sumsB[label] || 0);

    return {
      labels,
      datasets: [
        { data: dataA, color: '#4CAF50', label: 'Periodo A' }, // String en vez de función
        { data: dataB, color: '#2196F3', label: 'Periodo B' }, // String en vez de función
      ],
    };
  }
}
