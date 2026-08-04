import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ExpenseNature } from 'src/expenses/enums/expense-nature.enum';

export class CreateBudgetDto {
  @IsNotEmpty()
  @IsNumber()
  readonly budget: number;

  @IsNotEmpty()
  @IsInt()
  readonly year: number;

  @MaxLength(200, {
    message: 'La ciudad supera los 200 caracteres',
  })
  @IsString()
  readonly city: string;

  readonly userId: number;

  @IsNotEmpty()
  @IsInt()
  readonly subcategoryId: number;

  @IsNotEmpty()
  @IsInt()
  readonly categoryId: number;

  @IsOptional()
  @IsEnum(ExpenseNature)
  readonly nature?: ExpenseNature;
}
