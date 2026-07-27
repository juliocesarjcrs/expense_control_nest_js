import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThemeConfig } from './entities/theme-config.entity';
import {
  CreateThemeDto,
  UpdateThemeDto,
  ActivateThemeDto,
  UpdateColorsDto,
} from './dto/theme-config.dto';

@Injectable()
export class ThemeConfigService {
  constructor(
    @InjectRepository(ThemeConfig)
    private readonly themeConfigRepository: Repository<ThemeConfig>,
  ) {}

  async findAll(): Promise<ThemeConfig[]> {
    return this.themeConfigRepository.find({
      order: { themeName: 'ASC' },
    });
  }

  async getActiveTheme(): Promise<ThemeConfig> {
    const theme = await this.themeConfigRepository.findOne({
      where: { isActive: 1 },
    });

    if (!theme) {
      const defaultTheme = await this.findByName('default');
      return defaultTheme;
    }

    return theme;
  }

  async findByName(themeName: string): Promise<ThemeConfig> {
    const theme = await this.themeConfigRepository.findOne({
      where: { themeName },
    });

    if (!theme) {
      throw new NotFoundException(`Tema "${themeName}" no encontrado`);
    }

    return theme;
  }

  async findById(id: number): Promise<ThemeConfig> {
    const theme = await this.themeConfigRepository.findOne({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException(`Tema con ID ${id} no encontrado`);
    }

    return theme;
  }

  async create(
    createDto: CreateThemeDto,
    userId: number,
  ): Promise<ThemeConfig> {
    const exists = await this.themeConfigRepository.findOne({
      where: { themeName: createDto.themeName },
    });

    if (exists) {
      throw new BadRequestException(`Tema "${createDto.themeName}" ya existe`);
    }

    if (createDto.isActive) {
      await this.deactivateAllThemes();
    }

    const theme = this.themeConfigRepository.create({
      themeName: createDto.themeName,
      colors: createDto.colors,
      isActive: createDto.isActive ? 1 : 0,
      updatedBy: userId,
    });

    return this.themeConfigRepository.save(theme);
  }

  async update(
    themeName: string,
    updateDto: UpdateThemeDto,
    userId: number,
  ): Promise<ThemeConfig> {
    const theme = await this.findByName(themeName);

    if (updateDto.isActive) {
      await this.deactivateAllThemes();
    }

    if (updateDto.themeName !== undefined) {
      theme.themeName = updateDto.themeName;
    }
    if (updateDto.colors !== undefined) {
      theme.colors = updateDto.colors;
    }
    if (updateDto.isActive !== undefined) {
      theme.isActive = updateDto.isActive ? 1 : 0;
    }
    theme.updatedBy = userId;

    return this.themeConfigRepository.save(theme);
  }

  async updateColors(
    themeName: string,
    updateColorsDto: UpdateColorsDto,
    userId: number,
  ): Promise<ThemeConfig> {
    const theme = await this.findByName(themeName);

    theme.colors = {
      ...theme.colors,
      ...updateColorsDto.colors,
    };
    theme.updatedBy = userId;

    return this.themeConfigRepository.save(theme);
  }

  async activateTheme(
    activateDto: ActivateThemeDto,
    userId: number,
  ): Promise<ThemeConfig> {
    const theme = await this.findByName(activateDto.themeName);

    await this.deactivateAllThemes();

    theme.isActive = 1;
    theme.updatedBy = userId;

    return this.themeConfigRepository.save(theme);
  }

  async remove(themeName: string): Promise<void> {
    const theme = await this.findByName(themeName);

    if (theme.isActive === 1) {
      throw new BadRequestException('No se puede eliminar el tema activo');
    }

    if (theme.themeName === 'default') {
      throw new BadRequestException('No se puede eliminar el tema default');
    }

    await this.themeConfigRepository.remove(theme);
  }

  private async deactivateAllThemes(): Promise<void> {
    await this.themeConfigRepository
      .createQueryBuilder()
      .update(ThemeConfig)
      .set({ isActive: 0 })
      .where('1 = 1')
      .execute();
  }

  async getActiveColors(): Promise<Record<string, string>> {
    const theme = await this.getActiveTheme();
    return theme.colors;
  }
}
