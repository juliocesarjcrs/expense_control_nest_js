import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateExpenseDto } from './create-expense.dto';

export class CreateManyExpensesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseDto)
  expenses: CreateExpenseDto[];
}
