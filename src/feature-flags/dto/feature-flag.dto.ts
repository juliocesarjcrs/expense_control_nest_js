import {
  IsBoolean,
  IsDateString,
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

  @IsBoolean()
  @IsOptional()
  defaultForUsers?: boolean;

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

  @IsBoolean()
  @IsOptional()
  defaultForUsers?: boolean;

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

export class GrantUserPermissionDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  featureKey: string;

  @IsBoolean()
  @IsNotEmpty()
  isAllowed: boolean;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class UpdateUserPermissionDto {
  @IsBoolean()
  @IsOptional()
  isAllowed?: boolean;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class BulkGrantPermissionsDto {
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  userIds: number[];

  @IsString()
  @IsNotEmpty()
  featureKey: string;

  @IsBoolean()
  @IsNotEmpty()
  isAllowed: boolean;

  @IsString()
  @IsOptional()
  reason?: string;
}
