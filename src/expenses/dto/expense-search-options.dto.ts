import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsDate,
} from 'class-validator';

export class ExpenseSearchOptionsDto {
  @Transform(({ value }) => {
    // Si ya es un array, retornarlo
    if (Array.isArray(value)) return value.map(Number);
    // Si es un string, convertirlo a array
    if (typeof value === 'string') return [Number(value)];
    // Si es undefined, retornar array vacío
    return [];
  })
  @IsArray()
  subcategoriesId: number[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  searchValue?: string;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}
