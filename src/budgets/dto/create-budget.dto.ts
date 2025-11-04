import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBudgetDto {
  @IsNotEmpty()
  readonly budget: number;

  @IsNotEmpty()
  readonly year: number;

  @MaxLength(200, {
    message: 'El comentario supera los 200 caracteres',
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
