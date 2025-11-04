import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateAIModelDto {
  @IsString()
  provider_type: 'openrouter' | 'openai' | 'custom';

  @IsString()
  model_name: string;

  @IsString()
  api_endpoint: string;

  @IsString()
  api_key_ref: string; // Ej: OPENROUTER_API_KEY

  @IsNumber()
  @Min(1)
  priority: number;

  @IsBoolean()
  // @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(10)
  @Max(32000)
  max_tokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsBoolean()
  @IsOptional()
  supports_tools?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;

  // Campos opcionales para sincronizar con AIModel
  @IsNumber()
  @IsOptional()
  health_score?: number;

  @IsNumber()
  @IsOptional()
  error_count?: number;

  @IsOptional()
  last_tested_at?: Date;
}
