import { PartialType } from '@nestjs/mapped-types';
import { CreateAIModelDto } from './create-ai-model.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateAIModelDto extends PartialType(CreateAIModelDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
