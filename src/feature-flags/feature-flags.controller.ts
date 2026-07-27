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
import { AuthenticatedRequestWithRole } from './interfaces/authenticated-request-with-role.interface';
import { FeatureFlag } from './entities/feature-flag.entity';
import { UserFeaturePermission } from './entities/user-feature-permission.entity';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  // ============================================
  // ENDPOINTS EXISTENTES (Feature Flags)
  // ============================================

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequestWithRole,
  ): Promise<FeatureFlag[]> {
    const user = req.user;

    if (user.role === 1) {
      return this.featureFlagsService.findAll();
    }

    return this.featureFlagsService.findAllEnabled();
  }

  @Public()
  @Get('enabled')
  async findEnabled(): Promise<FeatureFlag[]> {
    return this.featureFlagsService.findAllEnabled();
  }

  /**
   * NUEVO: Obtener features accesibles para el usuario actual
   */
  @Get('my-features')
  async getMyFeatures(
    @Request() req: AuthenticatedRequestWithRole,
  ): Promise<FeatureFlag[]> {
    const userId = req.user.id;
    return this.featureFlagsService.getUserAccessibleFeatures(userId);
  }

  @Public()
  @Get('chatbot/status')
  async getChatbotStatus(): Promise<{
    featureKey: string;
    isEnabled: boolean;
  }> {
    const isEnabled = await this.featureFlagsService.getChatbotStatus();
    return { featureKey: 'chatbot', isEnabled };
  }

  @Get(':key')
  async findOne(@Param('key') key: string): Promise<FeatureFlag> {
    return this.featureFlagsService.findByKey(key);
  }

  @Get(':key/status')
  async checkStatus(
    @Param('key') key: string,
  ): Promise<{ featureKey: string; isEnabled: boolean }> {
    const isEnabled = await this.featureFlagsService.isEnabled(key);
    return { featureKey: key, isEnabled };
  }

  /**
   * NUEVO: Verificar si el usuario actual puede acceder a una feature
   */
  @Get(':key/can-access')
  async canAccess(
    @Param('key') key: string,
    @Request() req: AuthenticatedRequestWithRole,
  ): Promise<{ featureKey: string; canAccess: boolean }> {
    const userId = req.user.id;
    const canAccess = await this.featureFlagsService.canUserAccessFeature(
      userId,
      key,
    );
    return { featureKey: key, canAccess };
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(
    @Body() createDto: CreateFeatureFlagDto,
    @Request() req: AuthenticatedRequestWithRole,
  ): Promise<FeatureFlag> {
    const userId = req.user.id;
    return this.featureFlagsService.create(createDto, userId);
  }

  @Put(':key')
  @UseGuards(AdminGuard)
  async update(
    @Param('key') key: string,
    @Body() updateDto: UpdateFeatureFlagDto,
    @Request() req: AuthenticatedRequestWithRole,
  ): Promise<FeatureFlag> {
    const userId = req.user.id;
    return this.featureFlagsService.update(key, updateDto, userId);
  }

  @Put(':key/toggle')
  @UseGuards(AdminGuard)
  async toggle(
    @Param('key') key: string,
    @Body() toggleDto: ToggleFeatureDto,
    @Request() req: AuthenticatedRequestWithRole,
  ): Promise<FeatureFlag> {
    const userId = req.user.id;
    return this.featureFlagsService.toggle(key, toggleDto, userId);
  }

  @Delete(':key')
  @UseGuards(AdminGuard)
  async remove(@Param('key') key: string): Promise<{ message: string }> {
    await this.featureFlagsService.remove(key);
    return { message: `Feature flag "${key}" eliminada exitosamente` };
  }

  // ============================================
  // NUEVOS ENDPOINTS (User Permissions)
  // ============================================

  @Get('permissions/user/:userId')
  @UseGuards(AdminGuard)
  async getUserPermissions(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserFeaturePermission[]> {
    return this.featureFlagsService.getUserPermissions(userId);
  }

  @Get('permissions/feature/:featureKey')
  @UseGuards(AdminGuard)
  async getFeaturePermissions(
    @Param('featureKey') featureKey: string,
  ): Promise<UserFeaturePermission[]> {
    return this.featureFlagsService.getFeaturePermissions(featureKey);
  }

  @Post('permissions')
  @UseGuards(AdminGuard)
  async grantPermission(
    @Body() dto: GrantUserPermissionDto,
    @Request() req: AuthenticatedRequestWithRole,
  ): Promise<UserFeaturePermission> {
    const grantedBy = req.user.id;
    return this.featureFlagsService.grantUserPermission(dto, grantedBy);
  }

  @Put('permissions/:userId/:featureKey')
  @UseGuards(AdminGuard)
  async updatePermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('featureKey') featureKey: string,
    @Body() dto: UpdateUserPermissionDto,
  ): Promise<UserFeaturePermission> {
    return this.featureFlagsService.updateUserPermission(
      userId,
      featureKey,
      dto,
    );
  }

  @Delete('permissions/:userId/:featureKey')
  @UseGuards(AdminGuard)
  async revokePermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('featureKey') featureKey: string,
  ): Promise<{ message: string }> {
    await this.featureFlagsService.revokeUserPermission(userId, featureKey);
    return { message: 'Permiso revocado exitosamente' };
  }

  @Post('permissions/bulk')
  @UseGuards(AdminGuard)
  async bulkGrantPermissions(
    @Body() dto: BulkGrantPermissionsDto,
    @Request() req: AuthenticatedRequestWithRole,
  ): Promise<UserFeaturePermission[]> {
    const grantedBy = req.user.id;
    return this.featureFlagsService.bulkGrantPermissions(dto, grantedBy);
  }

  @Post('permissions/cleanup')
  @UseGuards(AdminGuard)
  async cleanupExpiredPermissions(): Promise<{ message: string }> {
    const count = await this.featureFlagsService.cleanExpiredPermissions();
    return { message: `${count} permisos expirados eliminados` };
  }
}
