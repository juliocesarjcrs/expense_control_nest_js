import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateConfigDto {
  @IsObject()
  @IsNotEmpty()
  config_value: any;

  @IsString()
  @IsOptional()
  change_reason?: string;
}
