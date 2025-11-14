import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  ValidateNested,
  IsDateString,
} from 'class-validator';

class PeriodDto {
  @IsDateString()
  start: Date;

  @IsDateString()
  end: Date;
}

class CategoryWithSubcategoriesDto {
  @IsNumber()
  categoryId: number;

  @IsArray()
  subcategoriesId: number[];
}

export class ComparePeriodsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryWithSubcategoriesDto)
  categories: CategoryWithSubcategoriesDto[];

  @ValidateNested()
  @Type(() => PeriodDto)
  periodA: PeriodDto;

  @ValidateNested()
  @Type(() => PeriodDto)
  periodB: PeriodDto;
}
