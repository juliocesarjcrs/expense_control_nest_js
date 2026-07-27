import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

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
}
