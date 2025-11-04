import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ToolExecutionContext,
  ToolExecutionResult,
  ToolExecutor,
} from 'src/chatbot/interfaces/tool.interface';
import { Saving } from 'src/saving/entities/saving.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SavingsExecutor implements ToolExecutor {
  private readonly logger = new Logger(SavingsExecutor.name);

  constructor(
    @InjectRepository(Saving)
    private savingRepo: Repository<Saving>,
  ) {}

  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const { userId, parameters } = context;

    try {
      const queryBuilder = this.savingRepo
        .createQueryBuilder('saving')
        .where('saving.userId = :userId', { userId });

      // Filtro por fechas
      const { startDate, endDate } = this.getDateRange(parameters);
      queryBuilder.andWhere('saving.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

      // Filtro por ahorro mínimo
      if (parameters.minSaving !== undefined) {
        queryBuilder.andWhere('saving.saving >= :minSaving', {
          minSaving: parameters.minSaving,
        });
      }

      const query = queryBuilder.orderBy('saving.date', 'DESC');
      if (parameters.limit) {
        query.take(parameters.limit);
      }

      const savings = await query.getMany();
      const processedData = this.processSavings(savings);

      return {
        success: true,
        data: processedData,
        metadata: {
          executionTime: Date.now() - startTime,
          dataSource: 'database',
        },
      };
    } catch (error) {
      this.logger.error('Error fetching savings:', error);
      return {
        success: false,
        error: error.message,
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  }

  private getDateRange(parameters: any) {
    if (parameters.startDate && parameters.endDate) {
      return {
        startDate: parameters.startDate,
        endDate: parameters.endDate,
      };
    }
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: parameters.startDate || firstDay,
      endDate: parameters.endDate || lastDay,
    };
  }

  private processSavings(savings: any[]): any {
    if (!savings || savings.length === 0) {
      return {
        summary: 'No se encontraron registros de ahorro',
        isEmpty: true,
      };
    }

    const totalSaving = savings.reduce((sum, s) => sum + s.saving, 0);
    const totalIncome = savings.reduce((sum, s) => sum + s.income, 0);
    const totalExpense = savings.reduce((sum, s) => sum + s.expense, 0);

    const average = totalSaving / savings.length;
    const savingRate = totalIncome > 0 ? (totalSaving / totalIncome) * 100 : 0;

    const detailedSavings = savings.map((s) => ({
      id: s.id,
      date: s.date,
      income: s.income,
      expense: s.expense,
      saving: s.saving,
      commentary: s.commentary,
    }));

    const positiveDays = savings.filter((s) => s.saving > 0).length;
    const negativeDays = savings.filter((s) => s.saving < 0).length;

    return {
      summary: `Ahorro total: $${totalSaving.toFixed(2)} en ${savings.length} registros. Tasa de ahorro: ${savingRate.toFixed(1)}%`,
      totalSaving: parseFloat(totalSaving.toFixed(2)),
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      average: parseFloat(average.toFixed(2)),
      savingRate: parseFloat(savingRate.toFixed(1)),
      positiveDays,
      negativeDays,
      detailedSavings,
      dateRange: {
        oldest: savings[savings.length - 1]?.date,
        newest: savings[0]?.date,
      },
      isEmpty: false,
    };
  }
}
