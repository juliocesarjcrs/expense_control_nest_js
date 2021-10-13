import { Module } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { IncomesController } from './incomes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './entities/income.entity';
import { DatesService } from 'src/utils/dates/dates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Income])],
  controllers: [IncomesController],
  providers: [IncomesService, DatesService],
  exports: [IncomesService],
})
export class IncomesModule {}
