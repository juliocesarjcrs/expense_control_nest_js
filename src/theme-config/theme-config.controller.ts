import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ThemeConfigService } from './theme-config.service';
import {
  CreateThemeDto,
  UpdateThemeDto,
  ActivateThemeDto,
  UpdateColorsDto,
} from './dto/theme-config.dto';
import { Public } from 'src/utils/decorators/custumDecorators';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('theme-config')
export class ThemeConfigController {
  constructor(private readonly themeConfigService: ThemeConfigService) {}

  /**
   * GET /theme-config/active
   * Obtener el tema activo (público para todos)
   */
  @Public()
  @Get('active')
  async getActiveTheme() {
    return this.themeConfigService.getActiveTheme();
  }

  /**
   * GET /theme-config/active/colors
   * Obtener solo los colores del tema activo (público, ligero)
   */
  @Public()
  @Get('active/colors')
  async getActiveColors() {
    return this.themeConfigService.getActiveColors();
  }

  /**
   * GET /theme-config
   * Obtener todos los temas (requiere auth)
   */
  @Get()
  async findAll() {
    return this.themeConfigService.findAll();
  }

  /**
   * POST /theme-config
   * Crear nuevo tema (solo admin)
   */
  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() createDto: CreateThemeDto, @Request() req) {
    const userId = req.user.id;
    return this.themeConfigService.create(createDto, userId);
  }

  /**
   * GET /theme-config/:name
   * Obtener un tema específico por nombre
   */
  @Get(':name')
  async findOne(@Param('name') name: string) {
    return this.themeConfigService.findByName(name);
  }

  /**
   * PUT /theme-config/activate
   * Activar un tema (solo admin)
   */
  @Put('activate')
  @UseGuards(AdminGuard)
  async activate(@Body() activateDto: ActivateThemeDto, @Request() req) {
    const userId = req.user.id;
    return this.themeConfigService.activateTheme(activateDto, userId);
  }

  /**
   * PUT /theme-config/:name
   * Actualizar tema completo (solo admin)
   */
  @Put(':name')
  @UseGuards(AdminGuard)
  async update(
    @Param('name') name: string,
    @Body() updateDto: UpdateThemeDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.themeConfigService.update(name, updateDto, userId);
  }

  /**
   * PUT /theme-config/:name/colors
   * Actualizar solo colores de un tema (solo admin)
   */
  @Put(':name/colors')
  @UseGuards(AdminGuard)
  async updateColors(
    @Param('name') name: string,
    @Body() updateColorsDto: UpdateColorsDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.themeConfigService.updateColors(name, updateColorsDto, userId);
  }

  /**
   * DELETE /theme-config/:name
   * Eliminar tema (solo admin, no se puede eliminar el activo ni default)
   */
  @Delete(':name')
  @UseGuards(AdminGuard)
  async remove(@Param('name') name: string) {
    await this.themeConfigService.remove(name);
    return { message: `Tema "${name}" eliminado exitosamente` };
  }
}
