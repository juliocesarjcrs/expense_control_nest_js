import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ExpenseNature } from '../enums/expense-nature.enum';
// import { Subcategory } from 'src/subcategories/entities/subcategory.entity';

export class CreateExpenseDto {
  @IsNotEmpty()
  readonly cost: number;

  @MaxLength(200, {
    message: 'El comentario supera los 200 caracteres',
  })
  @IsString()
  readonly commentary: string;

  @IsDateString()
  readonly date: Date;

  readonly userId: number;

  @IsNotEmpty()
  @IsInt()
  readonly subcategoryId: number;

  @IsOptional()
  @IsUUID()
  readonly idempotencyKey?: string;

  @IsOptional()
  @IsEnum(ExpenseNature)
  readonly nature?: ExpenseNature;
}
