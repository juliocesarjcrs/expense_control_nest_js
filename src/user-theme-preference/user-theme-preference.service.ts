import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserThemePreference } from './entities/user-theme-preference.entity';
import { ThemeConfig } from '../theme-config/entities/theme-config.entity';
import {
  SelectThemeDto,
  SetCustomColorsDto,
  UpdateUserThemePreferenceDto,
} from './dto/user-theme-preference.dto';
import { UserThemeResponseDto } from './interfaces/user-theme-preference.interface';
import { ThemeConfigService } from '../theme-config/theme-config.service';

@Injectable()
export class UserThemePreferenceService {
  constructor(
    @InjectRepository(UserThemePreference)
    private readonly userThemePreferenceRepository: Repository<UserThemePreference>,
    private readonly themeConfigService: ThemeConfigService,
  ) {}

  async getUserThemeConfig(userId: number): Promise<UserThemeResponseDto> {
    const preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
      relations: { theme: true },
    });

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

    if (preference.useCustomColors && preference.customColors) {
      let baseTheme: ThemeConfig;
      if (preference.themeId) {
        baseTheme = await this.themeConfigService.findById(preference.themeId);
      } else {
        baseTheme = await this.themeConfigService.getActiveTheme();
      }

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

    const globalTheme = await this.themeConfigService.getActiveTheme();
    return {
      userId,
      themeName: globalTheme.themeName,
      colors: globalTheme.colors,
      isCustom: false,
      themeId: globalTheme.id,
    };
  }

  async getUserColors(userId: number): Promise<Record<string, string>> {
    const config = await this.getUserThemeConfig(userId);
    return config.colors;
  }

  async selectTheme(
    userId: number,
    selectThemeDto: SelectThemeDto,
  ): Promise<UserThemePreference> {
    await this.themeConfigService.findById(selectThemeDto.themeId);

    let preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (preference) {
      preference.themeId = selectThemeDto.themeId;
      preference.useCustomColors = 0;
    } else {
      preference = this.userThemePreferenceRepository.create({
        userId,
        themeId: selectThemeDto.themeId,
        useCustomColors: 0,
      });
    }

    return this.userThemePreferenceRepository.save(preference);
  }

  async setCustomColors(
    userId: number,
    setCustomColorsDto: SetCustomColorsDto,
  ): Promise<UserThemePreference> {
    let preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (preference) {
      preference.customColors = setCustomColorsDto.customColors;
      preference.useCustomColors = 1;
    } else {
      preference = this.userThemePreferenceRepository.create({
        userId,
        customColors: setCustomColorsDto.customColors,
        useCustomColors: 1,
      });
    }

    return this.userThemePreferenceRepository.save(preference);
  }

  async updateCustomColors(
    userId: number,
    colors: Record<string, string>,
  ): Promise<UserThemePreference> {
    const preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      throw new NotFoundException(
        'Usuario no tiene preferencias de tema configuradas',
      );
    }

    preference.customColors = {
      ...(preference.customColors || {}),
      ...colors,
    };
    preference.useCustomColors = 1;

    return this.userThemePreferenceRepository.save(preference);
  }

  async updatePreference(
    userId: number,
    updateDto: UpdateUserThemePreferenceDto,
  ): Promise<UserThemePreference> {
    const preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      const newPreference = this.userThemePreferenceRepository.create({
        userId,
        themeId: updateDto.themeId,
        customColors: updateDto.customColors,
        useCustomColors: updateDto.useCustomColors ? 1 : 0,
      });
      return this.userThemePreferenceRepository.save(newPreference);
    }

    if (updateDto.themeId !== undefined) {
      preference.themeId = updateDto.themeId;
    }
    if (updateDto.customColors !== undefined) {
      preference.customColors = updateDto.customColors;
    }
    if (updateDto.useCustomColors !== undefined) {
      preference.useCustomColors = updateDto.useCustomColors ? 1 : 0;
    }

    return this.userThemePreferenceRepository.save(preference);
  }

  async resetToGlobal(userId: number): Promise<void> {
    const preference = await this.userThemePreferenceRepository.findOne({
      where: { userId },
    });

    if (preference) {
      await this.userThemePreferenceRepository.remove(preference);
    }
  }

  async getUserPreference(userId: number): Promise<UserThemePreference | null> {
    return this.userThemePreferenceRepository.findOne({
      where: { userId },
      relations: { theme: true },
    });
  }

  async getAvailableThemes(): Promise<ThemeConfig[]> {
    return this.themeConfigService.findAll();
  }
}
