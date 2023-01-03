import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSavingDto {
  @IsNotEmpty()
  readonly saving: number;

  @IsNotEmpty()
  readonly expense: number;

  @IsNotEmpty()
  readonly income: number;

  @MaxLength(200, {
    message: 'El comentario supera los 200 caracteres',
  })
  @IsString()
  readonly commentary: string;

  @IsDateString()
  readonly date: Date;

  readonly userId: number;
}
