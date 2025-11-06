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
import { FeatureFlagsService } from './feature-flags.service';
import {
  CreateFeatureFlagDto,
  ToggleFeatureDto,
  UpdateFeatureFlagDto,
} from './dto/feature-flag.dto';
import { Public } from 'src/utils/decorators/custumDecorators';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  /**
   * GET /feature-flags
   * Obtener todas las feature flags (usuarios normales solo ven activas)
   */
  @Get()
  async findAll(@Request() req) {
    const user = req.user;

    // Si es admin, muestra todas; si es usuario normal, solo las activas
    if (user.role === 1) {
      return this.featureFlagsService.findAll();
    }

    return this.featureFlagsService.findAllEnabled();
  }

  /**
   * GET /feature-flags/enabled
   * Obtener solo features activas (público para todos)
   */
  @Public()
  @Get('enabled')
  async findEnabled() {
    return this.featureFlagsService.findAllEnabled();
  }

  /**
   * GET /feature-flags/chatbot/status
   * Endpoint específico para verificar estado del chatbot (público)
   */
  @Public()
  @Get('chatbot/status')
  async getChatbotStatus() {
    const isEnabled = await this.featureFlagsService.getChatbotStatus();
    return { featureKey: 'chatbot', isEnabled };
  }

  /**
   * GET /feature-flags/:key
   * Obtener una feature específica por su key
   */
  @Get(':key')
  async findOne(@Param('key') key: string) {
    return this.featureFlagsService.findByKey(key);
  }

  /**
   * GET /feature-flags/:key/status
   * Verificar si una feature está habilitada
   */
  @Get(':key/status')
  async checkStatus(@Param('key') key: string) {
    const isEnabled = await this.featureFlagsService.isEnabled(key);
    return { featureKey: key, isEnabled };
  }

  /**
   * POST /feature-flags
   * Crear nueva feature flag (solo admin)
   */
  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() createDto: CreateFeatureFlagDto, @Request() req) {
    const userId = req.user.id;
    return this.featureFlagsService.create(createDto, userId);
  }

  /**
   * PUT /feature-flags/:key
   * Actualizar feature flag (solo admin)
   */
  @Put(':key')
  @UseGuards(AdminGuard)
  async update(
    @Param('key') key: string,
    @Body() updateDto: UpdateFeatureFlagDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.featureFlagsService.update(key, updateDto, userId);
  }

  /**
   * PUT /feature-flags/:key/toggle
   * Activar/Desactivar feature (solo admin)
   */
  @Put(':key/toggle')
  @UseGuards(AdminGuard)
  async toggle(
    @Param('key') key: string,
    @Body() toggleDto: ToggleFeatureDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.featureFlagsService.toggle(key, toggleDto, userId);
  }

  /**
   * DELETE /feature-flags/:key
   * Eliminar feature flag (solo admin)
   */
  @Delete(':key')
  @UseGuards(AdminGuard)
  async remove(@Param('key') key: string) {
    await this.featureFlagsService.remove(key);
    return { message: `Feature flag "${key}" eliminada exitosamente` };
  }
}
