import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';

export class SelectThemeDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  themeId: number;
}

export class SetCustomColorsDto {
  @IsObject()
  @IsNotEmpty()
  customColors: Record<string, string>;
}

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
