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
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import {
  CreateFeatureFlagDto,
  ToggleFeatureDto,
  UpdateFeatureFlagDto,
  GrantUserPermissionDto,
  UpdateUserPermissionDto,
  BulkGrantPermissionsDto,
} from './dto/feature-flag.dto';
import { Public } from 'src/utils/decorators/custumDecorators';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  // ============================================
  // ENDPOINTS EXISTENTES (Feature Flags)
  // ============================================

  @Get()
  async findAll(@Request() req) {
    const user = req.user;

    if (user.role === 1) {
      return this.featureFlagsService.findAll();
    }

    return this.featureFlagsService.findAllEnabled();
  }

  @Public()
  @Get('enabled')
  async findEnabled() {
    return this.featureFlagsService.findAllEnabled();
  }

  /**
   * NUEVO: Obtener features accesibles para el usuario actual
   */
  @Get('my-features')
  async getMyFeatures(@Request() req) {
    const userId = req.user.id;
    return this.featureFlagsService.getUserAccessibleFeatures(userId);
  }

  @Public()
  @Get('chatbot/status')
  async getChatbotStatus() {
    const isEnabled = await this.featureFlagsService.getChatbotStatus();
    return { featureKey: 'chatbot', isEnabled };
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    return this.featureFlagsService.findByKey(key);
  }

  @Get(':key/status')
  async checkStatus(@Param('key') key: string) {
    const isEnabled = await this.featureFlagsService.isEnabled(key);
    return { featureKey: key, isEnabled };
  }

  /**
   * NUEVO: Verificar si el usuario actual puede acceder a una feature
   */
  @Get(':key/can-access')
  async canAccess(@Param('key') key: string, @Request() req) {
    const userId = req.user.id;
    const canAccess = await this.featureFlagsService.canUserAccessFeature(
      userId,
      key,
    );
    return { featureKey: key, canAccess };
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() createDto: CreateFeatureFlagDto, @Request() req) {
    const userId = req.user.id;
    return this.featureFlagsService.create(createDto, userId);
  }

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

  @Delete(':key')
  @UseGuards(AdminGuard)
  async remove(@Param('key') key: string) {
    await this.featureFlagsService.remove(key);
    return { message: `Feature flag "${key}" eliminada exitosamente` };
  }

  // ============================================
  // NUEVOS ENDPOINTS (User Permissions)
  // ============================================

  /**
   * Obtener permisos de un usuario específico
   */
  @Get('permissions/user/:userId')
  @UseGuards(AdminGuard)
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.featureFlagsService.getUserPermissions(userId);
  }

  /**
   * Obtener todos los usuarios con permiso para una feature
   */
  @Get('permissions/feature/:featureKey')
  @UseGuards(AdminGuard)
  async getFeaturePermissions(@Param('featureKey') featureKey: string) {
    return this.featureFlagsService.getFeaturePermissions(featureKey);
  }

  /**
   * Otorgar o denegar permiso a un usuario
   */
  @Post('permissions')
  @UseGuards(AdminGuard)
  async grantPermission(@Body() dto: GrantUserPermissionDto, @Request() req) {
    const grantedBy = req.user.id;
    return this.featureFlagsService.grantUserPermission(dto, grantedBy);
  }

  /**
   * Actualizar permiso existente
   */
  @Put('permissions/:userId/:featureKey')
  @UseGuards(AdminGuard)
  async updatePermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('featureKey') featureKey: string,
    @Body() dto: UpdateUserPermissionDto,
  ) {
    return this.featureFlagsService.updateUserPermission(
      userId,
      featureKey,
      dto,
    );
  }

  /**
   * Revocar permiso (eliminar)
   */
  @Delete('permissions/:userId/:featureKey')
  @UseGuards(AdminGuard)
  async revokePermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('featureKey') featureKey: string,
  ) {
    await this.featureFlagsService.revokeUserPermission(userId, featureKey);
    return { message: 'Permiso revocado exitosamente' };
  }

  /**
   * Otorgar permisos a múltiples usuarios
   */
  @Post('permissions/bulk')
  @UseGuards(AdminGuard)
  async bulkGrantPermissions(
    @Body() dto: BulkGrantPermissionsDto,
    @Request() req,
  ) {
    const grantedBy = req.user.id;
    return this.featureFlagsService.bulkGrantPermissions(dto, grantedBy);
  }

  /**
   * Limpiar permisos expirados (endpoint de mantenimiento)
   */
  @Post('permissions/cleanup')
  @UseGuards(AdminGuard)
  async cleanupExpiredPermissions() {
    const count = await this.featureFlagsService.cleanExpiredPermissions();
    return { message: `${count} permisos expirados eliminados` };
  }
}
