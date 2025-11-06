import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

// DTO para crear una nueva feature flag
export class CreateFeatureFlagDto {
  @IsString()
  @IsNotEmpty()
  featureKey: string;

  @IsString()
  @IsNotEmpty()
  featureName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  requiresRole?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

// DTO para actualizar una feature flag
export class UpdateFeatureFlagDto {
  @IsString()
  @IsOptional()
  featureName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  requiresRole?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

// DTO para toggle (activar/desactivar)
export class ToggleFeatureDto {
  @IsBoolean()
  @IsNotEmpty()
  isEnabled: boolean;
}

// DTO de respuesta
export interface FeatureFlagResponseDto {
  id: number;
  featureKey: string;
  featureName: string;
  description: string | null;
  isEnabled: boolean;
  requiresRole: number | null;
  metadata: Record<string, any> | null;
  updatedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}
