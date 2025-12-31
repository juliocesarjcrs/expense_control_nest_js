import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AverageBySubcategoriesDto {
  @IsNumber()
  @Type(() => Number)
  year: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  referenceYear?: number;
}
