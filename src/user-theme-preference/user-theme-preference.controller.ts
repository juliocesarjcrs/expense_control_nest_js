import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Request,
} from '@nestjs/common';
import { UserThemePreferenceService } from './user-theme-preference.service';
import {
  SelectThemeDto,
  SetCustomColorsDto,
  UpdateUserThemePreferenceDto,
} from './dto/user-theme-preference.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

@Controller('user-theme')
export class UserThemePreferenceController {
  constructor(
    private readonly userThemePreferenceService: UserThemePreferenceService,
  ) {}

  @Get('my-theme')
  async getMyTheme(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.userThemePreferenceService.getUserThemeConfig(userId);
  }

  @Get('my-colors')
  async getMyColors(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.userThemePreferenceService.getUserColors(userId);
  }

  @Get('available')
  async getAvailableThemes() {
    return this.userThemePreferenceService.getAvailableThemes();
  }

  @Get('my-preference')
  async getMyPreference(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.userThemePreferenceService.getUserPreference(userId);
  }

  @Post('select-theme')
  async selectTheme(
    @Body() selectThemeDto: SelectThemeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    await this.userThemePreferenceService.selectTheme(userId, selectThemeDto);
    return {
      message: 'Tema seleccionado exitosamente',
      theme: await this.userThemePreferenceService.getUserThemeConfig(userId),
    };
  }

  @Post('custom-colors')
  async setCustomColors(
    @Body() setCustomColorsDto: SetCustomColorsDto,
    @Request() req: AuthenticatedRequest,
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

  @Put('update-colors')
  async updateColors(
    @Body() updateColorsDto: { colors: Record<string, string> },
    @Request() req: AuthenticatedRequest,
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

  @Put('preference')
  async updatePreference(
    @Body() updateDto: UpdateUserThemePreferenceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    await this.userThemePreferenceService.updatePreference(userId, updateDto);
    return {
      message: 'Preferencias actualizadas exitosamente',
      theme: await this.userThemePreferenceService.getUserThemeConfig(userId),
    };
  }

  @Delete('reset')
  async resetToGlobal(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    await this.userThemePreferenceService.resetToGlobal(userId);
    return {
      message: 'Preferencias reseteadas al tema global',
      theme: await this.userThemePreferenceService.getUserThemeConfig(userId),
    };
  }
}
