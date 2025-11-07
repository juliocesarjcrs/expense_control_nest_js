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

  /**
   * Obtener todos los temas
   */
  async findAll(): Promise<ThemeConfig[]> {
    return this.themeConfigRepository.find({
      order: { themeName: 'ASC' },
    });
  }

  /**
   * Obtener el tema activo (para frontend)
   */
  async getActiveTheme(): Promise<ThemeConfig> {
    const theme = await this.themeConfigRepository.findOne({
      where: { isActive: 1 },
    });

    if (!theme) {
      // Si no hay tema activo, retornar el default
      const defaultTheme = await this.findByName('default');
      return defaultTheme;
    }

    return theme;
  }

  /**
   * Obtener un tema por nombre
   */
  async findByName(themeName: string): Promise<ThemeConfig> {
    const theme = await this.themeConfigRepository.findOne({
      where: { themeName },
    });

    if (!theme) {
      throw new NotFoundException(`Tema "${themeName}" no encontrado`);
    }

    return theme;
  }

  /**
   * Obtener un tema por ID
   */
  async findById(id: number): Promise<ThemeConfig> {
    const theme = await this.themeConfigRepository.findOne({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException(`Tema con ID ${id} no encontrado`);
    }

    return theme;
  }

  /**
   * Crear un nuevo tema
   */
  async create(
    createDto: CreateThemeDto,
    userId: number,
  ): Promise<ThemeConfig> {
    // Verificar si ya existe
    const exists = await this.themeConfigRepository.findOne({
      where: { themeName: createDto.themeName },
    });

    if (exists) {
      throw new BadRequestException(`Tema "${createDto.themeName}" ya existe`);
    }

    // Si se marca como activo, desactivar otros
    if (createDto.isActive) {
      await this.deactivateAllThemes();
    }

    const theme = this.themeConfigRepository.create({
      ...createDto,
      isActive: createDto.isActive ? 1 : 0,
      updatedBy: userId,
    });

    return this.themeConfigRepository.save(theme);
  }

  /**
   * Actualizar un tema
   */
  async update(
    themeName: string,
    updateDto: UpdateThemeDto,
    userId: number,
  ): Promise<ThemeConfig> {
    const theme = await this.findByName(themeName);

    // Si se activa este tema, desactivar otros
    if (updateDto.isActive) {
      await this.deactivateAllThemes();
    }

    Object.assign(theme, {
      ...updateDto,
      isActive:
        updateDto.isActive !== undefined
          ? updateDto.isActive
            ? 1
            : 0
          : theme.isActive,
      updatedBy: userId,
    });

    return this.themeConfigRepository.save(theme);
  }

  /**
   * Actualizar solo los colores de un tema
   */
  async updateColors(
    themeName: string,
    updateColorsDto: UpdateColorsDto,
    userId: number,
  ): Promise<ThemeConfig> {
    const theme = await this.findByName(themeName);

    // Mezclar colores existentes con los nuevos
    theme.colors = {
      ...theme.colors,
      ...updateColorsDto.colors,
    };
    theme.updatedBy = userId;

    return this.themeConfigRepository.save(theme);
  }

  /**
   * Activar un tema (desactiva los demás automáticamente)
   */
  async activateTheme(
    activateDto: ActivateThemeDto,
    userId: number,
  ): Promise<ThemeConfig> {
    const theme = await this.findByName(activateDto.themeName);

    // Desactivar todos los temas
    await this.deactivateAllThemes();

    // Activar el tema solicitado
    theme.isActive = 1;
    theme.updatedBy = userId;

    return this.themeConfigRepository.save(theme);
  }

  /**
   * Eliminar un tema (no se puede eliminar el activo)
   */
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

  /**
   * Desactivar todos los temas (helper privado)
   */
  private async deactivateAllThemes(): Promise<void> {
    await this.themeConfigRepository
      .createQueryBuilder()
      .update(ThemeConfig)
      .set({ isActive: 0 })
      .where('1 = 1') // ← Forzar condición para todas las filas
      .execute();
  }

  /**
   * Obtener solo los colores del tema activo (para frontend ligero)
   */
  async getActiveColors(): Promise<Record<string, string>> {
    const theme = await this.getActiveTheme();
    return theme.colors;
  }
}
