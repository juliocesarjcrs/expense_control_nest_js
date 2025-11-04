import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Budget } from 'src/budgets/entities/budget.entity';
import {
  ToolExecutionContext,
  ToolExecutionResult,
  ToolExecutor,
} from 'src/chatbot/interfaces/tool.interface';
import { Expense } from 'src/expenses/entities/expense.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BudgetsExecutor implements ToolExecutor {
  private readonly logger = new Logger(BudgetsExecutor.name);

  constructor(
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
  ) {}

  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const { userId, parameters } = context;

    try {
      const year = parameters.year || new Date().getFullYear();

      const queryBuilder = this.budgetRepo
        .createQueryBuilder('budget')
        .where('budget.userId = :userId', { userId })
        .andWhere('budget.year = :year', { year });

      if (parameters.category) {
        // Necesitarías joins con categoría/subcategoría
        queryBuilder.andWhere('budget.categoryId = :categoryId', {
          categoryId: parameters.category,
        });
      }

      if (parameters.city) {
        queryBuilder.andWhere('budget.city = :city', { city: parameters.city });
      }

      const budgets = await queryBuilder.getMany();

      // Obtener gastos del año para calcular progreso
      const expenses = await this.expenseRepo
        .createQueryBuilder('expense')
        .where('expense.userId = :userId', { userId })
        .andWhere('YEAR(expense.date) = :year', { year })
        .getMany();

      const processedData = this.processBudgets(budgets, expenses);

      return {
        success: true,
        data: processedData,
        metadata: {
          executionTime: Date.now() - startTime,
          dataSource: 'database',
        },
      };
    } catch (error) {
      this.logger.error('Error fetching budgets:', error);
      return {
        success: false,
        error: error.message,
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  }

  private processBudgets(budgets: any[], expenses: any[]): any {
    if (!budgets || budgets.length === 0) {
      return {
        summary: 'No se encontraron presupuestos configurados',
        isEmpty: true,
      };
    }

    const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.cost, 0);

    const budgetDetails = budgets.map((budget) => {
      const spent = expenses
        .filter((e) => e.subcategoryId === budget.subcategoryId)
        .reduce((sum, e) => sum + e.cost, 0);

      const percentage = (spent / budget.budget) * 100;
      const remaining = budget.budget - spent;

      return {
        id: budget.id,
        budgetAmount: budget.budget,
        spent: parseFloat(spent.toFixed(2)),
        remaining: parseFloat(remaining.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(1)),
        status:
          percentage > 100 ? 'excedido' : percentage > 80 ? 'alerta' : 'normal',
        categoryId: budget.categoryId,
        subcategoryId: budget.subcategoryId,
        city: budget.city,
        year: budget.year,
      };
    });

    const overBudget = budgetDetails.filter((b) => b.percentage > 100);

    return {
      summary: `${budgets.length} presupuestos configurados. Total presupuestado: $${totalBudget.toFixed(2)}, Total gastado: $${totalSpent.toFixed(2)}`,
      totalBudget: parseFloat(totalBudget.toFixed(2)),
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      totalRemaining: parseFloat((totalBudget - totalSpent).toFixed(2)),
      overallPercentage: parseFloat(
        ((totalSpent / totalBudget) * 100).toFixed(1),
      ),
      budgetsExceeded: overBudget.length,
      budgetDetails,
      isEmpty: false,
    };
  }
}
