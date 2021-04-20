import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'expense_control',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Category, Subcategory, Expense]),
    AuthModule,
    UsersModule,
    SubcategoriesModule,
    ExpensesModule,
  ],
  controllers: [
    AppController,
    UsersController,
    CategoriesController,
    SubcategoriesController,
    ExpensesController,
  ],
  providers: [
    AppService,
    UsersService,
    CategoriesService,
    AuthService,
    SubcategoriesService,
    ExpensesService,
  ],
})
export class AppModule {}
