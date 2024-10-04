import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { DatesService } from 'src/utils/dates/dates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],

  controllers: [ExpensesController],
  providers: [ExpensesService, DatesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
