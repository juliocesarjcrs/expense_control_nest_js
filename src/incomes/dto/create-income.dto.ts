import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateIncomeDto {
  @IsNotEmpty()
  readonly amount: number;

  @IsNotEmpty()
  @IsInt()
  readonly categoryId: number;

  @MaxLength(200, {
    message: 'El comentario supera los 200 caracteres',
  })
  @IsString()
  readonly commentary: string;

  @IsDateString()
  readonly date: Date;

  readonly userId: number;
}
