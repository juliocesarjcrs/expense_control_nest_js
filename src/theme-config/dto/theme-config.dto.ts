import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

// DTO para crear un nuevo tema
export class CreateThemeDto {
  @IsString()
  @IsNotEmpty()
  themeName: string;

  @IsObject()
  @IsNotEmpty()
  colors: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// DTO para actualizar un tema
export class UpdateThemeDto {
  @IsString()
  @IsOptional()
  themeName?: string;

  @IsObject()
  @IsOptional()
  colors?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// DTO para activar un tema
export class ActivateThemeDto {
  @IsString()
  @IsNotEmpty()
  themeName: string;
}

// DTO para actualizar colores específicos
export class UpdateColorsDto {
  @IsObject()
  @IsNotEmpty()
  colors: Record<string, string>;
}

// DTO de respuesta
export interface ThemeConfigResponseDto {
  id: number;
  themeName: string;
  isActive: boolean;
  colors: Record<string, string>;
  updatedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}
