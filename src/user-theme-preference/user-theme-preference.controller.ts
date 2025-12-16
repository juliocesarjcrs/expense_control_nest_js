import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserThemePreferenceService } from './user-theme-preference.service';
import {
  SelectThemeDto,
  SetCustomColorsDto,
  UpdateUserThemePreferenceDto,
} from './dto/user-theme-preference.dto';

@Controller('user-theme')
export class UserThemePreferenceController {
  constructor(
    private readonly userThemePreferenceService: UserThemePreferenceService,
  ) {}

  /**
   * GET /user-theme/my-theme
   * Obtener la configuración completa del tema del usuario actual
   */
  @Get('my-theme')
  async getMyTheme(@Request() req) {
    const userId = req.user.id;
    return this.userThemePreferenceService.getUserThemeConfig(userId);
  }

  /**
   * GET /user-theme/my-colors
   * Obtener solo los colores del tema del usuario (endpoint ligero)
   */
  @Get('my-colors')
  async getMyColors(@Request() req) {
    const userId = req.user.id;
    return this.userThemePreferenceService.getUserColors(userId);
  }

  /**
   * GET /user-theme/available
   * Listar todos los temas disponibles para elegir
   */
  @Get('available')
  async getAvailableThemes() {
    return this.userThemePreferenceService.getAvailableThemes();
  }

  /**
   * GET /user-theme/my-preference
   * Obtener las preferencias raw del usuario (sin procesar)
   */
  @Get('my-preference')
  async getMyPreference(@Request() req) {
    const userId = req.user.id;
    return this.userThemePreferenceService.getUserPreference(userId);
  }

  /**
   * POST /user-theme/select-theme
   * Seleccionar un tema predefinido
   */
  @Post('select-theme')
  async selectTheme(@Body() selectThemeDto: SelectThemeDto, @Request() req) {
    const userId = req.user.id;
    await this.userThemePreferenceService.selectTheme(userId, selectThemeDto);
    return {
      message: 'Tema seleccionado exitosamente',
      theme: await this.userThemePreferenceService.getUserThemeConfig(userId),
    };
  }

  /**
   * POST /user-theme/custom-colors
   * Establecer colores personalizados completos
   */
  @Post('custom-colors')
  async setCustomColors(
    @Body() setCustomColorsDto: SetCustomColorsDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    await this.userThemePreferenceService.setCustomColors(
      userId,
      setCustomColorsDto,
    );
    return {
      message: 'Colores personalizados establecidos exitosamente',
      theme: await this.userThemePreferenceService.getUserThemeConfig(userId),
    };
  }

  /**
   * PUT /user-theme/update-colors
   * Actualizar colores personalizados (merge con existentes)
   */
  @Put('update-colors')
  async updateColors(
    @Body() updateColorsDto: { colors: Record<string, string> },
    @Request() req,
  ) {
    const userId = req.user.id;
    await this.userThemePreferenceService.updateCustomColors(
      userId,
      updateColorsDto.colors,
    );
    return {
      message: 'Colores actualizados exitosamente',
      theme: await this.userThemePreferenceService.getUserThemeConfig(userId),
    };
  }

  /**
   * PUT /user-theme/preference
   * Actualizar preferencias completas
   */
  @Put('preference')
  async updatePreference(
    @Body() updateDto: UpdateUserThemePreferenceDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    await this.userThemePreferenceService.updatePreference(userId, updateDto);
    return {
      message: 'Preferencias actualizadas exitosamente',
      theme: await this.userThemePreferenceService.getUserThemeConfig(userId),
    };
  }

  /**
   * DELETE /user-theme/reset
   * Resetear al tema global (eliminar preferencias personales)
   */
  @Delete('reset')
  async resetToGlobal(@Request() req) {
    const userId = req.user.id;
    await this.userThemePreferenceService.resetToGlobal(userId);
    return {
      message: 'Preferencias reseteadas al tema global',
      theme: await this.userThemePreferenceService.getUserThemeConfig(userId),
    };
  }
}
