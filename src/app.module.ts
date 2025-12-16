import { HttpStatus, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';

// import { IsUserAlreadyExist } from './utils/validations/validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuthService } from './auth/auth.service';
import { Category } from './categories/entities/category.entity';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { Subcategory } from './subcategories/entities/subcategory.entity';
import { SubcategoriesController } from './subcategories/subcategories.controller';
import { SubcategoriesService } from './subcategories/subcategories.service';
import { ExpensesModule } from './expenses/expenses.module';
import { Expense } from './expenses/entities/expense.entity';
import { ExpensesController } from './expenses/expenses.controller';
import { ExpensesService } from './expenses/expenses.service';
import { ConfigModule } from '@nestjs/config';
import { IncomesModule } from './incomes/incomes.module';
import { IncomesService } from './incomes/incomes.service';
import { Income } from './incomes/entities/income.entity';
import { IncomesController } from './incomes/incomes.controller';
import { MailModule } from './mail/mail.module';
import { DatesModule } from './utils/dates/dates.module';
import { typeOrmConfigAsync } from './config/typeorm.config';
import { FilesModule } from './files/files.module';
import { SavingModule } from './saving/saving.module';
import { Saving } from './saving/entities/saving.entity';
import { SavingController } from './saving/saving.controller';
import { SavingService } from './saving/saving.service';
import { BudgetsModule } from './budgets/budgets.module';
import { BudgetsService } from './budgets/budgets.service';
import { Budget } from './budgets/entities/budget.entity';
import { LoansModule } from './loans/loans.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { Loan } from './loans/entities/loan.entity';
import { ChatbotModule } from './chatbot/chatbot.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { ThemeConfigModule } from './theme-config/theme-config.module';
import { UserThemePreferenceModule } from './user-theme-preference/user-theme-preference.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      driver: ApolloDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({ req, res }) => ({ req, res }),
      formatError: (error) => {
        const originalError = error.extensions?.originalError as any;
        if (error.extensions?.code === 'BAD_USER_INPUT') {
          return {
            message: error.message,
            code: error.extensions.code,
          };
        }
        if (originalError) {
          return {
            statusCode:
              originalError.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
            message: originalError.message || error.message,
            timestamp: originalError.timestamp || new Date().toISOString(),
            path: originalError.path || error.path,
          };
        }
        return {
          message: error.message,
          code: error.extensions?.code,
        };
      },
    }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    TypeOrmModule.forFeature([
      User,
      Category,
      Subcategory,
      Expense,
      Income,
      Saving,
      Budget,
      Loan,
    ]),
    AuthModule,
    UsersModule,
    SubcategoriesModule,
    ExpensesModule,
    IncomesModule,
    MailModule,
    DatesModule,
    FilesModule,
    SavingModule,
    BudgetsModule,
    LoansModule,
    ChatbotModule.register(),
    FeatureFlagsModule,
    ThemeConfigModule,
    UserThemePreferenceModule,
  ],
  controllers: [
    AppController,
    UsersController,
    CategoriesController,
    SubcategoriesController,
    ExpensesController,
    IncomesController,
    SavingController,
  ],
  providers: [
    AppService,
    UsersService,
    CategoriesService,
    AuthService,
    SubcategoriesService,
    ExpensesService,
    IncomesService,
    SavingService,
    BudgetsService,
  ],
})
export class AppModule {}
