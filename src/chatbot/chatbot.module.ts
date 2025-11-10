import { Module, DynamicModule } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ToolsRegistry } from './tools/tools.registry';
import { ToolExecutorService } from './services/tool-executor.service';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { IncomesModule } from 'src/incomes/incomes.module';
import { LoansModule } from 'src/loans/loans.module';
import { BudgetsModule } from 'src/budgets/budgets.module';
import { SavingModule } from 'src/saving/saving.module';
import { ExpensesExecutor } from './tools/executors/expenses.executor';
import { Expense } from 'src/expenses/entities/expense.entity';
import { IncomesExecutor } from './tools/executors/incomes.executor';
import { SavingsExecutor } from './tools/executors/savings.executor';
import { BudgetsExecutor } from './tools/executors/budgets.executor';
import { LoansExecutor } from './tools/executors/loans.executor';
import { Income } from 'src/incomes/entities/income.entity';
import { Saving } from 'src/saving/entities/saving.entity';
import { Budget } from 'src/budgets/entities/budget.entity';
import { Loan } from 'src/loans/entities/loan.entity';
import { ChatbotService } from './services/chatbot.service';
import { AIModelManagerService } from './services/ai-model-manager.service';
import { AIModel } from './entities/ai-model.entity';
import { AIModelHealthLog } from './entities/ai-model-health-log.entity';
import { ConversationLog } from './entities/conversation-log.entity';
import { ChatbotConfigService } from '../chatbot-config/chatbot-config.service';
import { ChatbotConfigModule } from 'src/chatbot-config/chatbot-config.module';
import { CategoriesModule } from 'src/categories/categories.module';

@Module({})
export class ChatbotModule {
  static register(): DynamicModule {
    return {
      module: ChatbotModule,
      imports: [
        ConfigModule,
        TypeOrmModule.forFeature([
          Conversation,
          Message,
          Expense,
          Income,
          Saving,
          Budget,
          Loan,
          AIModel,
          AIModelHealthLog,
          ConversationLog,
        ]),
        ExpensesModule,
        IncomesModule,
        LoansModule,
        BudgetsModule,
        SavingModule,
        ChatbotConfigModule,
        CategoriesModule,
      ],
      controllers: [ChatbotController],
      providers: [
        // Manager central
        AIModelManagerService,

        // Servicios core
        ChatbotService,
        ToolExecutorService,
        // Registrar ejecutores específicos
        ExpensesExecutor,
        IncomesExecutor,
        SavingsExecutor,
        BudgetsExecutor,
        LoansExecutor,
        // Registry con factory que registra todos los executors
        {
          provide: ToolsRegistry,
          useFactory: (
            chatbotConfigService: ChatbotConfigService,
            expensesExecutor: ExpensesExecutor,
            incomesExecutor: IncomesExecutor,
            savingsExecutor: SavingsExecutor,
            budgetsExecutor: BudgetsExecutor,
            loansExecutor: LoansExecutor,
          ) => {
            const registry = new ToolsRegistry(chatbotConfigService);

            // Inicializar con TODOS los executores
            registry.initializeAllTools({
              expensesExecutor,
              incomesExecutor,
              savingsExecutor,
              budgetsExecutor,
              loansExecutor,
            });

            return registry;
          },
          inject: [
            ChatbotConfigService,
            ExpensesExecutor,
            IncomesExecutor,
            SavingsExecutor,
            BudgetsExecutor,
            LoansExecutor,
          ],
        },
        // Servicios core (deben ir DESPUÉS del registry)
        ToolExecutorService,
        ChatbotService,
      ],
      exports: [ChatbotService, ToolsRegistry],
    };
  }
}
