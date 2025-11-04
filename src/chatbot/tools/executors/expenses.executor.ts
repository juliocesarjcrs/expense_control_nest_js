import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  ToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult,
} from '../../interfaces/tool.interface';
import { Expense } from 'src/expenses/entities/expense.entity';

/**
 * Executor optimizado para consultas de gastos con soporte para preguntas específicas
 */
@Injectable()
export class ExpensesExecutor implements ToolExecutor {
  private readonly logger = new Logger(ExpensesExecutor.name);

  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
  ) {}

  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const { userId, parameters } = context;

    try {
      this.logger.log(`Fetching expenses for user ${userId}`, parameters);

      // Construir query dinámica con joins optimizados
      const queryBuilder = this.expenseRepo
        .createQueryBuilder('expense')
        .leftJoinAndSelect('expense.subcategories', 'subcategory')
        .leftJoinAndSelect('subcategory.category', 'category')
        .where('expense.userId = :userId', { userId });

      // Filtro por fechas
      if (parameters.startDate && parameters.endDate) {
        queryBuilder.andWhere('expense.date BETWEEN :startDate AND :endDate', {
          startDate: parameters.startDate,
          endDate: parameters.endDate,
        });
      } else if (parameters.startDate) {
        queryBuilder.andWhere('expense.date >= :startDate', {
          startDate: parameters.startDate,
        });
      } else if (parameters.endDate) {
        queryBuilder.andWhere('expense.date <= :endDate', {
          endDate: parameters.endDate,
        });
      } else {
        // Por defecto, mes actual
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        queryBuilder.andWhere('expense.date BETWEEN :firstDay AND :lastDay', {
          firstDay,
          lastDay,
        });
      }

      // Filtro por categoría (nombre de categoría o subcategoría)
      if (parameters.category) {
        queryBuilder.andWhere(
          '(LOWER(category.name) LIKE LOWER(:category) OR LOWER(subcategory.name) LIKE LOWER(:category))',
          { category: `%${parameters.category}%` },
        );
      }

      // Filtro por subcategoría específica
      if (parameters.subcategory) {
        queryBuilder.andWhere(
          'LOWER(subcategory.name) LIKE LOWER(:subcategory)',
          {
            subcategory: `%${parameters.subcategory}%`,
          },
        );
      }

      // Filtro por rango de monto
      if (parameters.minAmount) {
        queryBuilder.andWhere('expense.cost >= :minAmount', {
          minAmount: parameters.minAmount,
        });
      }
      if (parameters.maxAmount) {
        queryBuilder.andWhere('expense.cost <= :maxAmount', {
          maxAmount: parameters.maxAmount,
        });
      }

      // Ejecutar query con ordenamiento y límite
      const query = queryBuilder.orderBy('expense.date', 'DESC');

      if (parameters.limit) {
        query.take(parameters.limit);
      }
      const expenses = await query.getMany();

      this.logger.log(`Found ${expenses.length} expenses`);

      // Procesar datos con información enriquecida
      const processedData = this.processExpenses(expenses, parameters);

      return {
        success: true,
        data: processedData,
        metadata: {
          executionTime: Date.now() - startTime,
          dataSource: 'database',
          queryParams: parameters,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching expenses:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Procesa y estructura los datos para responder preguntas específicas del LLM
   */
  private processExpenses(expenses: any[], parameters: any): any {
    if (!expenses || expenses.length === 0) {
      return {
        summary: 'No se encontraron gastos para los criterios especificados',
        total: 0,
        count: 0,
        isEmpty: true,
        answer: 'No hay gastos registrados que coincidan con tu consulta.',
      };
    }

    // Calcular total
    const total = expenses.reduce((sum, exp) => sum + (exp.cost || 0), 0);

    // Agrupar por categoría principal
    const byCategory = expenses.reduce((acc, exp) => {
      const categoryName = exp.subcategories?.category?.name || 'Sin categoría';
      if (!acc[categoryName]) {
        acc[categoryName] = {
          total: 0,
          count: 0,
          percentage: 0,
          subcategories: {},
          items: [],
        };
      }
      acc[categoryName].total += exp.cost || 0;
      acc[categoryName].count += 1;

      // Agrupar por subcategoría dentro de cada categoría
      const subcategoryName = exp.subcategories?.name || 'Sin subcategoría';
      if (!acc[categoryName].subcategories[subcategoryName]) {
        acc[categoryName].subcategories[subcategoryName] = {
          total: 0,
          count: 0,
          items: [],
        };
      }
      acc[categoryName].subcategories[subcategoryName].total += exp.cost || 0;
      acc[categoryName].subcategories[subcategoryName].count += 1;

      const item = {
        id: exp.id,
        description: exp.commentary || 'Sin descripción',
        amount: exp.cost,
        date: exp.date,
        subcategory: subcategoryName,
        category: categoryName,
      };

      acc[categoryName].items.push(item);
      acc[categoryName].subcategories[subcategoryName].items.push(item);

      return acc;
    }, {});

    // Calcular porcentajes
    Object.keys(byCategory).forEach((cat) => {
      byCategory[cat].percentage = (
        (byCategory[cat].total / total) *
        100
      ).toFixed(1);
    });

    // Lista detallada de gastos con toda la información
    const detailedExpenses = expenses.map((exp) => ({
      id: exp.id,
      description: exp.commentary || 'Sin descripción',
      amount: exp.cost,
      date: exp.date,
      subcategory: exp.subcategories?.name || 'Sin subcategoría',
      category: exp.subcategories?.category?.name || 'Sin categoría',
      icon: exp.subcategories?.icon || null,
    }));

    // Top gastos
    const topExpenses = [...detailedExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Estadísticas
    const amounts = expenses.map((e) => e.cost);
    const average = total / expenses.length;
    const median = this.calculateMedian(amounts);

    // Análisis temporal (gastos por día)
    const byDate = expenses.reduce((acc, exp) => {
      const date = exp.date instanceof Date ? exp.date : new Date(exp.date);
      const dateKey = date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          total: 0,
          count: 0,
          items: [],
        };
      }
      acc[dateKey].total += exp.cost || 0;
      acc[dateKey].count += 1;
      acc[dateKey].items.push({
        description: exp.commentary,
        amount: exp.cost,
        category: exp.subcategories?.category?.name,
        subcategory: exp.subcategories?.name,
      });
      return acc;
    }, {});

    // Generar respuesta contextual basada en los parámetros
    const answer = this.generateContextualAnswer(
      expenses.length,
      total,
      byCategory,
      detailedExpenses,
      parameters,
    );

    return {
      summary: `Se encontraron ${expenses.length} gastos por un total de $${total.toFixed(2)}`,
      answer,
      total: parseFloat(total.toFixed(2)),
      count: expenses.length,
      average: parseFloat(average.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      byCategory,
      byDate,
      detailedExpenses,
      topExpenses,
      dateRange: {
        oldest: expenses[expenses.length - 1]?.date,
        newest: expenses[0]?.date,
      },
      isEmpty: false,
    };
  }

  /**
   * Genera una respuesta contextual basada en la consulta
   */
  private generateContextualAnswer(
    count: number,
    total: number,
    byCategory: any,
    detailedExpenses: any[],
    parameters: any,
  ): string {
    const parts = [];

    if (parameters.category) {
      const categoryExpenses = detailedExpenses.filter(
        (e) =>
          e.category
            .toLowerCase()
            .includes(parameters.category.toLowerCase()) ||
          e.subcategory
            .toLowerCase()
            .includes(parameters.category.toLowerCase()),
      );

      if (categoryExpenses.length > 0) {
        parts.push(
          `Encontré ${categoryExpenses.length} gasto(s) relacionado(s) con "${parameters.category}"`,
        );
        parts.push(
          `Total gastado: $${categoryExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}`,
        );

        // Mostrar fechas de los gastos
        const dates = categoryExpenses
          .map((e) => {
            const date = new Date(e.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          })
          .join(', ');
        parts.push(`Fechas: ${dates}`);
      }
    } else {
      parts.push(
        `Tienes ${count} gastos registrados por un total de $${total.toFixed(2)}`,
      );

      // Categoría con más gastos
      const topCategory = Object.entries(byCategory).sort(
        ([, a]: any, [, b]: any) => b.total - a.total,
      )[0] as [string, any] | undefined;

      if (topCategory) {
        const [categoryName, categoryData] = topCategory;
        parts.push(
          `La categoría con más gastos es "${categoryName}" con $${categoryData.total.toFixed(2)} (${categoryData.percentage}%)`,
        );
      }
    }

    return parts.join('. ');
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
