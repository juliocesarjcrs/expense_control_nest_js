import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDto } from './create-budget.dto';

export class UpdateExpenseDto extends PartialType(CreateBudgetDto) {}
