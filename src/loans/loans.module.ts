import { Module } from '@nestjs/common';
import { Loan } from './entities/loan.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansResolver } from './loans.resolver';
import { LoansService } from './loans.service';

@Module({
  imports: [TypeOrmModule.forFeature([Loan])],
  providers: [LoansResolver, LoansService],
  exports: [LoansService],
})
export class LoansModule {}
