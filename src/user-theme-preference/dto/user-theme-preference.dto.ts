import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';

/**
 * DTO para seleccionar un tema predefinido
 */
export class SelectThemeDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  themeId: number;
}

/**
 * DTO para establecer colores personalizados
 */
export class SetCustomColorsDto {
  @IsObject()
  @IsNotEmpty()
  customColors: Record<string, string>;
}

/**
 * DTO para actualizar preferencias de tema
 */
export class UpdateUserThemePreferenceDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  themeId?: number;

  @IsObject()
  @IsOptional()
  customColors?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  useCustomColors?: boolean;
}

/**
 * DTO de respuesta con la configuración efectiva del usuario
 */
export interface UserThemeResponseDto {
  userId: number;
  themeName: string;
  colors: Record<string, string>;
  isCustom: boolean;
  themeId: number | null;
}
