import { IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class SavingsPeriodAnalysisDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  @IsBoolean()
  compareWithPrevious?: boolean;
}
