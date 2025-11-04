import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ToolExecutionContext,
  ToolExecutionResult,
  ToolExecutor,
} from 'src/chatbot/interfaces/tool.interface';
import { Income } from 'src/incomes/entities/income.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IncomesExecutor implements ToolExecutor {
  private readonly logger = new Logger(IncomesExecutor.name);

  constructor(
    @InjectRepository(Income)
    private incomeRepo: Repository<Income>,
  ) {}

  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const { userId, parameters } = context;

    try {
      const queryBuilder = this.incomeRepo
        .createQueryBuilder('income')
        .leftJoinAndSelect('income.category', 'category')
        .where('income.userId = :userId', { userId });

      // Filtro por fechas
      const { startDate, endDate } = this.getDateRange(parameters);
      queryBuilder.andWhere('income.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

      // Filtro por categoría
      if (parameters.category) {
        queryBuilder.andWhere('LOWER(category.name) LIKE LOWER(:category)', {
          category: `%${parameters.category}%`,
        });
      }

      // Filtro por montos
      if (parameters.minAmount) {
        queryBuilder.andWhere('income.amount >= :minAmount', {
          minAmount: parameters.minAmount,
        });
      }
      if (parameters.maxAmount) {
        queryBuilder.andWhere('income.amount <= :maxAmount', {
          maxAmount: parameters.maxAmount,
        });
      }

      const query = queryBuilder.orderBy('income.date', 'DESC');
      if (parameters.limit) {
        query.take(parameters.limit);
      }

      const incomes = await query.getMany();
      const processedData = this.processIncomes(incomes, parameters);

      return {
        success: true,
        data: processedData,
        metadata: {
          executionTime: Date.now() - startTime,
          dataSource: 'database',
        },
      };
    } catch (error) {
      this.logger.error('Error fetching incomes:', error);
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

  private processIncomes(incomes: any[], parameters: any): any {
    if (!incomes || incomes.length === 0) {
      return {
        summary: 'No se encontraron ingresos para los criterios especificados',
        total: 0,
        count: 0,
        isEmpty: true,
      };
    }

    const total = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);

    // Agrupar por categoría
    const byCategory = incomes.reduce((acc, inc) => {
      const categoryName = inc.category?.name || 'Sin categoría';
      if (!acc[categoryName]) {
        acc[categoryName] = { total: 0, count: 0, items: [] };
      }
      acc[categoryName].total += inc.amount || 0;
      acc[categoryName].count += 1;
      acc[categoryName].items.push({
        id: inc.id,
        description: inc.commentary || 'Sin descripción',
        amount: inc.amount,
        date: inc.date,
      });
      return acc;
    }, {});

    // Calcular porcentajes
    Object.keys(byCategory).forEach((cat) => {
      byCategory[cat].percentage = (
        (byCategory[cat].total / total) *
        100
      ).toFixed(1);
    });

    const detailedIncomes = incomes.map((inc) => ({
      id: inc.id,
      description: inc.commentary || 'Sin descripción',
      amount: inc.amount,
      date: inc.date,
      category: inc.category?.name || 'Sin categoría',
    }));

    const average = total / incomes.length;

    return {
      summary: `Se encontraron ${incomes.length} ingresos por un total de $${total.toFixed(2)}`,
      total: parseFloat(total.toFixed(2)),
      count: incomes.length,
      average: parseFloat(average.toFixed(2)),
      byCategory,
      detailedIncomes,
      dateRange: {
        oldest: incomes[incomes.length - 1]?.date,
        newest: incomes[0]?.date,
      },
      isEmpty: false,
    };
  }
}
