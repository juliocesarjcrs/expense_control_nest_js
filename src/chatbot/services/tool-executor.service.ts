import { Injectable, Logger } from '@nestjs/common';
import { ExpensesService } from 'src/expenses/expenses.service';
import { IncomesService } from 'src/incomes/incomes.service';
import { LoansService } from 'src/loans/loans.service';
import { BudgetsService } from 'src/budgets/budgets.service';
import { SavingService } from 'src/saving/saving.service';
import {
  ToolExecutionContext,
  ToolExecutionResult,
} from '../interfaces/tool.interface';
import { ToolsRegistry } from '../tools/tools.registry';

/**
 * Servicio que ejecuta las llamadas a tools usando servicios internos
 * Inyecta directamente los servicios de tu aplicación
 */
@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly toolsRegistry: ToolsRegistry,
    private readonly expensesService: ExpensesService,
    private readonly incomesService: IncomesService,
    private readonly loansService: LoansService,
    private readonly budgetsService: BudgetsService,
    private readonly savingService: SavingService,
  ) {}

  /**
   * Ejecuta una llamada a función (tool) específica
   */
  async executeToolCall(
    toolName: string,
    parameters: Record<string, any>,
    context: { userId: number; conversationId: number },
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Executing tool: ${toolName}`, parameters);
      // Obtener el executor del registry
      const executor = this.toolsRegistry.getExecutor(toolName);
      if (!executor) {
        throw new Error(`No executor found for tool: ${toolName}`);
      }

      // Ejecutar
      return await executor.execute({
        userId: context.userId,
        conversationId: context.conversationId,
        parameters,
      });
    } catch (error) {
      this.logger.error(`Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error.message || 'Error executing tool',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Enruta el tool al servicio correspondiente
   */
  private async routeToolToService(
    toolName: string,
    parameters: Record<string, any>,
    userId: number,
  ): Promise<any> {
    switch (toolName) {
      case 'get_expenses':
        return this.getExpenses(parameters, userId);

      case 'get_incomes':
        return this.getIncomes(parameters, userId);

      case 'get_loans':
        return this.getLoans(parameters, userId);

      case 'get_budgets':
        return this.getBudgets(parameters, userId);

      case 'get_savings':
        return this.getSavings(parameters, userId);

      case 'get_financial_summary':
        return this.getFinancialSummary(parameters, userId);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Obtiene gastos del usuario usando el servicio interno
   */
  private async getExpenses(params: any, userId: number): Promise<any> {
    // Llamar al servicio directamente
    const query = {
      numMonths: 2,
    };
    // const expenses = await this.expensesService.findAll({
    //   userId,
    //   startDate: params.startDate,
    //   endDate: params.endDate,
    //   category: params.category,
    //   limit: params.limit || 50,
    // });
    const expenses = await this.expensesService.findAll(userId, query);
    return this.formatExpensesForLLM(expenses);
  }

  /**
   * Formatea los gastos para el LLM
   */
  private formatExpensesForLLM(expenses: any): any {
    if (!expenses || expenses.length === 0) {
      return {
        summary: 'No se encontraron gastos para el período solicitado',
        total: 0,
        count: 0,
        isEmpty: true,
      };
    }

    const total = expenses.reduce(
      (sum: number, e: any) => sum + (e.amount || 0),
      0,
    );

    // Agrupar por categoría
    const byCategory = expenses.reduce((acc: any, expense: any) => {
      const category =
        expense.category?.name || expense.subcategory?.name || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, items: [] };
      }
      acc[category].total += expense.amount || 0;
      acc[category].count += 1;
      acc[category].items.push({
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
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

    return {
      summary: `Se encontraron ${expenses.length} gastos por un total de $${total.toFixed(2)}`,
      total: parseFloat(total.toFixed(2)),
      count: expenses.length,
      average: parseFloat((total / expenses.length).toFixed(2)),
      byCategory,
      topExpenses: expenses
        .sort((a: any, b: any) => b.amount - a.amount)
        .slice(0, 5)
        .map((e: any) => ({
          description: e.description,
          amount: e.amount,
          category: e.category?.name || e.subcategory?.name,
          date: e.date,
        })),
      isEmpty: false,
    };
  }

  private async getIncomes(params: any, userId: number): Promise<any> {
    const query = {
      numMonths: 2,
    };
    const incomes = await this.incomesService.findAll(userId, query);
    return this.formatIncomesForLLM(incomes);
  }

  private formatIncomesForLLM(incomes: any): any {
    if (!incomes || incomes.length === 0) {
      return {
        summary: 'No se encontraron ingresos para el período solicitado',
        total: 0,
        count: 0,
        isEmpty: true,
      };
    }

    const total = incomes.reduce(
      (sum: number, i: any) => sum + (i.amount || 0),
      0,
    );

    return {
      summary: `Total de ingresos: $${total.toFixed(2)} en ${incomes.length} transacciones`,
      total: parseFloat(total.toFixed(2)),
      count: incomes.length,
      average: parseFloat((total / incomes.length).toFixed(2)),
      bySource: incomes.reduce((acc: any, income: any) => {
        const source = income.source || 'Sin fuente';
        if (!acc[source]) acc[source] = { total: 0, count: 0 };
        acc[source].total += income.amount || 0;
        acc[source].count += 1;
        return acc;
      }, {}),
      isEmpty: false,
    };
  }

  private async getLoans(params: any, userId: number): Promise<any> {
    const loans = await this.loansService.findAll(userId);

    return this.formatLoansForLLM(loans);
  }

  private formatLoansForLLM(loans: any): any {
    if (!loans || loans.length === 0) {
      return {
        summary: 'No hay préstamos registrados',
        totalDebt: 0,
        count: 0,
        isEmpty: true,
      };
    }

    const totalDebt = loans.reduce(
      (sum: number, l: any) => sum + (l.remainingAmount || l.amount || 0),
      0,
    );

    return {
      summary: `Deuda total: $${totalDebt.toFixed(2)} en ${loans.length} préstamos`,
      totalDebt: parseFloat(totalDebt.toFixed(2)),
      count: loans.length,
      loans: loans.map((loan: any) => ({
        name: loan.name || loan.description,
        originalAmount: loan.amount,
        remainingAmount: loan.remainingAmount || loan.amount,
        interestRate: loan.interestRate,
        status: loan.status,
      })),
      isEmpty: false,
    };
  }

  private async getBudgets(params: any, userId: number): Promise<any> {
    const query = {
      year: 2025,
      city: '',
    };
    const budgets = await this.budgetsService.findAll(userId, query);

    return this.formatBudgetsForLLM(budgets);
  }

  private formatBudgetsForLLM(budgets: any): any {
    if (!budgets || budgets.length === 0) {
      return {
        summary: 'No hay presupuestos configurados',
        count: 0,
        isEmpty: true,
      };
    }

    return {
      summary: `${budgets.length} presupuestos configurados`,
      count: budgets.length,
      budgets: budgets.map((budget: any) => ({
        category: budget.category?.name || 'General',
        limit: budget.amount || budget.limit,
        spent: budget.spent || 0,
        remaining: (budget.amount || budget.limit) - (budget.spent || 0),
        percentageUsed: (
          ((budget.spent || 0) / (budget.amount || budget.limit)) *
          100
        ).toFixed(1),
        status:
          (budget.spent || 0) > (budget.amount || budget.limit)
            ? 'EXCEDIDO'
            : 'OK',
      })),
      overBudget: budgets.filter(
        (b: any) => (b.spent || 0) > (b.amount || b.limit),
      ).length,
      isEmpty: false,
    };
  }

  private async getSavings(params: any, userId: number): Promise<any> {
    const savings = await this.savingService.findAll(userId);

    return this.formatSavingsForLLM(savings);
  }

  private formatSavingsForLLM(savings: any): any {
    if (!savings || savings.length === 0) {
      return {
        summary: 'No hay metas de ahorro activas',
        count: 0,
        isEmpty: true,
      };
    }

    const totalSaved = savings.reduce(
      (sum: number, s: any) => sum + (s.currentAmount || s.amount || 0),
      0,
    );
    const totalGoal = savings.reduce(
      (sum: number, s: any) => sum + (s.goalAmount || s.goal || 0),
      0,
    );

    return {
      summary: `Has ahorrado $${totalSaved.toFixed(2)} de $${totalGoal.toFixed(2)}`,
      totalSaved: parseFloat(totalSaved.toFixed(2)),
      totalGoal: parseFloat(totalGoal.toFixed(2)),
      progress: totalGoal > 0 ? ((totalSaved / totalGoal) * 100).toFixed(1) : 0,
      count: savings.length,
      goals: savings.map((goal: any) => ({
        name: goal.name || goal.description,
        currentAmount: goal.currentAmount || goal.amount,
        goalAmount: goal.goalAmount || goal.goal,
        progress: (
          ((goal.currentAmount || goal.amount) /
            (goal.goalAmount || goal.goal)) *
          100
        ).toFixed(1),
        deadline: goal.deadline,
      })),
      isEmpty: false,
    };
  }

  private async getFinancialSummary(params: any, userId: number): Promise<any> {
    // Obtener todos los datos en paralelo
    const [expenses, incomes, loans, budgets, savings] = await Promise.all([
      this.getExpenses({}, userId),
      this.getIncomes({}, userId),
      this.getLoans({}, userId),
      this.getBudgets({}, userId),
      this.getSavings({}, userId),
    ]);

    const totalIncome = incomes.total || 0;
    const totalExpenses = expenses.total || 0;
    const balance = totalIncome - totalExpenses;

    return {
      summary: `Balance del período: ${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}`,
      balance: parseFloat(balance.toFixed(2)),
      incomes: {
        total: incomes.total,
        count: incomes.count,
      },
      expenses: {
        total: expenses.total,
        count: expenses.count,
        byCategory: expenses.byCategory,
      },
      savings: {
        total: savings.totalSaved,
        progress: savings.progress,
      },
      debts: {
        total: loans.totalDebt,
        count: loans.count,
      },
      budgets: {
        overBudget: budgets.overBudget,
        total: budgets.count,
      },
      savingsRate:
        totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0,
      isEmpty: expenses.isEmpty && incomes.isEmpty,
    };
  }
}
