import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  readonly cost: number;
  readonly commentary: string;
  readonly userId: number;
  @IsNotEmpty()
  @IsInt()
  readonly subcategoryId: number;
}
