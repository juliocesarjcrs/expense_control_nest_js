import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateConfigDto {
  @IsObject()
  @IsNotEmpty()
  config_value: Record<string, unknown>;

  @IsString()
  @IsOptional()
  change_reason?: string;
}
