import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserThemePreference } from './entities/user-theme-preference.entity';
import { ThemeConfig } from '../theme-config/entities/theme-config.entity';
import {
  SelectThemeDto,
  SetCustomColorsDto,
  UpdateUserThemePreferenceDto,
  UserThemeResponseDto,
} from './dto/user-theme-preference.dto';
import { ThemeConfigService } from '../theme-config/theme-config.service';

@Injectable()
export class UserThemePreferenceService {
  constructor(
    @InjectRepository(UserThemePreference)
    private readonly userThemePreferenceRepository: Repository<UserThemePreference>,
    private readonly themeConfigService: ThemeConfigService,
  ) {}

  /**
   * Obtener la configuración efectiva del tema para un usuario
   * Esta es la función principal que usa el frontend
   */
  async getUserThemeConfig(userId: number): Promise<UserThemeResponseDto> {
    // Buscar preferencias del usuario
    const preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
      relations: ['theme'],
    });

    // Si el usuario no tiene preferencias, usar el tema global activo
    if (!preference) {
      const globalTheme = await this.themeConfigService.getActiveTheme();
      return {
        userId,
        themeName: globalTheme.themeName,
        colors: globalTheme.colors,
        isCustom: false,
        themeId: globalTheme.id,
      };
    }

    // Si el usuario usa colores personalizados
    if (preference.useCustomColors && preference.customColors) {
      // Obtener el tema base (o el global si no tiene)
      let baseTheme: ThemeConfig;
      if (preference.themeId) {
        baseTheme = await this.themeConfigService.findById(preference.themeId);
      } else {
        baseTheme = await this.themeConfigService.getActiveTheme();
      }

      // Mezclar colores del tema base con los personalizados
      return {
        userId,
        themeName: `${baseTheme.themeName}-custom`,
        colors: {
          ...baseTheme.colors,
          ...preference.customColors,
        },
        isCustom: true,
        themeId: preference.themeId,
      };
    }

    // Si el usuario seleccionó un tema predefinido
    if (preference.themeId) {
      const selectedTheme = await this.themeConfigService.findById(
        preference.themeId,
      );
      return {
        userId,
        themeName: selectedTheme.themeName,
        colors: selectedTheme.colors,
        isCustom: false,
        themeId: selectedTheme.id,
      };
    }

    // Fallback: tema global
    const globalTheme = await this.themeConfigService.getActiveTheme();
    return {
      userId,
      themeName: globalTheme.themeName,
      colors: globalTheme.colors,
      isCustom: false,
      themeId: globalTheme.id,
    };
  }

  /**
   * Obtener solo los colores del tema del usuario (endpoint ligero)
   */
  async getUserColors(userId: number): Promise<Record<string, string>> {
    const config = await this.getUserThemeConfig(userId);
    return config.colors;
  }

  /**
   * Seleccionar un tema predefinido para el usuario
   */
  async selectTheme(
    userId: number,
    selectThemeDto: SelectThemeDto,
  ): Promise<UserThemePreference> {
    // Verificar que el tema existe
    await this.themeConfigService.findById(selectThemeDto.themeId);

    // Buscar o crear preferencia del usuario
    let preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (preference) {
      // Actualizar preferencia existente
      preference.themeId = selectThemeDto.themeId;
      preference.useCustomColors = 0;
    } else {
      // Crear nueva preferencia
      preference = this.userThemePreferenceRepository.create({
        userId,
        themeId: selectThemeDto.themeId,
        useCustomColors: 0,
      });
    }

    return this.userThemePreferenceRepository.save(preference);
  }

  /**
   * Establecer colores personalizados para el usuario
   */
  async setCustomColors(
    userId: number,
    setCustomColorsDto: SetCustomColorsDto,
  ): Promise<UserThemePreference> {
    // Buscar o crear preferencia del usuario
    let preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (preference) {
      // Actualizar colores personalizados
      preference.customColors = setCustomColorsDto.customColors;
      preference.useCustomColors = 1;
    } else {
      // Crear nueva preferencia con colores personalizados
      preference = this.userThemePreferenceRepository.create({
        userId,
        customColors: setCustomColorsDto.customColors,
        useCustomColors: 1,
      });
    }

    return this.userThemePreferenceRepository.save(preference);
  }

  /**
   * Actualizar colores personalizados (merge con existentes)
   */
  async updateCustomColors(
    userId: number,
    colors: Record<string, string>,
  ): Promise<UserThemePreference> {
    let preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      throw new NotFoundException(
        'Usuario no tiene preferencias de tema configuradas',
      );
    }

    // Mezclar con colores existentes
    preference.customColors = {
      ...(preference.customColors || {}),
      ...colors,
    };
    preference.useCustomColors = 1;

    return this.userThemePreferenceRepository.save(preference);
  }

  /**
   * Actualizar preferencias completas del usuario
   */
  async updatePreference(
    userId: number,
    updateDto: UpdateUserThemePreferenceDto,
  ): Promise<UserThemePreference> {
    let preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      // Crear nueva preferencia
      preference = this.userThemePreferenceRepository.create({
        userId,
        ...updateDto,
        useCustomColors: updateDto.useCustomColors ? 1 : 0,
      });
    } else {
      // Actualizar existente
      Object.assign(preference, {
        ...updateDto,
        useCustomColors:
          updateDto.useCustomColors !== undefined
            ? updateDto.useCustomColors
              ? 1
              : 0
            : preference.useCustomColors,
      });
    }

    return this.userThemePreferenceRepository.save(preference);
  }

  /**
   * Resetear preferencias del usuario (volver al tema global)
   */
  async resetToGlobal(userId: number): Promise<void> {
    const preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (preference) {
      await this.userThemePreferenceRepository.remove(preference);
    }
  }

  /**
   * Obtener preferencias del usuario (sin procesar)
   */
  async getUserPreference(userId: number): Promise<UserThemePreference | null> {
    return this.userThemePreferenceRepository.findOne({
      where: { userId },
      relations: ['theme'],
    });
  }

  /**
   * Listar todos los temas disponibles para que el usuario elija
   */
  async getAvailableThemes(): Promise<ThemeConfig[]> {
    return this.themeConfigService.findAll();
  }
}
