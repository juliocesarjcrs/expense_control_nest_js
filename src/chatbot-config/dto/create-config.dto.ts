import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateConfigDto {
  @IsString()
  @IsNotEmpty()
  config_key: string;

  @IsObject()
  @IsNotEmpty()
  config_value: Record<string, unknown>;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
