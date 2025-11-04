import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ToolExecutionContext,
  ToolExecutionResult,
  ToolExecutor,
} from 'src/chatbot/interfaces/tool.interface';
import { Loan } from 'src/loans/entities/loan.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LoansExecutor implements ToolExecutor {
  private readonly logger = new Logger(LoansExecutor.name);

  constructor(
    @InjectRepository(Loan)
    private loanRepo: Repository<Loan>,
  ) {}

  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const { userId, parameters } = context;

    try {
      const queryBuilder = this.loanRepo
        .createQueryBuilder('loan')
        .where('loan.userId = :userId', { userId });

      // Filtro por tipo
      if (parameters.type !== undefined) {
        queryBuilder.andWhere('loan.type = :type', { type: parameters.type });
      }

      // Filtro por montos
      if (parameters.minAmount) {
        queryBuilder.andWhere('loan.amount >= :minAmount', {
          minAmount: parameters.minAmount,
        });
      }
      if (parameters.maxAmount) {
        queryBuilder.andWhere('loan.amount <= :maxAmount', {
          maxAmount: parameters.maxAmount,
        });
      }

      const query = queryBuilder.orderBy('loan.amount', 'DESC');
      if (parameters.limit) {
        query.take(parameters.limit);
      }

      const loans = await query.getMany();
      const processedData = this.processLoans(loans);

      return {
        success: true,
        data: processedData,
        metadata: {
          executionTime: Date.now() - startTime,
          dataSource: 'database',
        },
      };
    } catch (error) {
      this.logger.error('Error fetching loans:', error);
      return {
        success: false,
        error: error.message,
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  }

  private processLoans(loans: any[]): any {
    if (!loans || loans.length === 0) {
      return {
        summary: 'No se encontraron préstamos o deudas',
        total: 0,
        count: 0,
        isEmpty: true,
      };
    }

    const total = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);

    // Separar por tipo
    const lent = loans.filter((l) => l.type === 0); // Te deben
    const owed = loans.filter((l) => l.type === 1); // Debes

    const totalLent = lent.reduce((sum, l) => sum + l.amount, 0);
    const totalOwed = owed.reduce((sum, l) => sum + l.amount, 0);

    const detailedLoans = loans.map((loan) => ({
      id: loan.id,
      type: loan.type === 0 ? 'Me deben' : 'Debo',
      amount: loan.amount,
      commentary: loan.commentary || 'Sin descripción',
    }));

    return {
      summary: `Total prestado: $${totalLent.toFixed(2)}, Total adeudado: $${totalOwed.toFixed(2)}`,
      total: parseFloat(total.toFixed(2)),
      count: loans.length,
      totalLent: parseFloat(totalLent.toFixed(2)),
      totalOwed: parseFloat(totalOwed.toFixed(2)),
      netBalance: parseFloat((totalLent - totalOwed).toFixed(2)),
      byType: {
        lent: { count: lent.length, total: totalLent },
        owed: { count: owed.length, total: totalOwed },
      },
      detailedLoans,
      isEmpty: false,
    };
  }
}
