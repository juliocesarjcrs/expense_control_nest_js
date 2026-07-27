export interface UserThemeResponseDto {
  userId: number;
  themeName: string;
  colors: Record<string, string>;
  isCustom: boolean;
  themeId: number | null;
}
