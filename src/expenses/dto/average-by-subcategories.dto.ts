import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseNature } from '../enums/expense-nature.enum';

export class AverageBySubcategoriesDto {
  @IsNumber()
  @Type(() => Number)
  year: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  referenceYear?: number;

  @IsOptional()
  @IsEnum(ExpenseNature)
  nature?: ExpenseNature;
}
