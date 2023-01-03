import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { IncomesModule } from 'src/incomes/incomes.module';
import { DatesService } from 'src/utils/dates/dates.service';
import { Saving } from './entities/saving.entity';
import { SavingController } from './saving.controller';
import { SavingService } from './saving.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Saving]),
    forwardRef(() => IncomesModule),
    forwardRef(() => ExpensesModule),
  ],
  controllers: [SavingController],
  providers: [SavingService, DatesService],
  exports: [SavingService],
})
export class SavingModule {}
