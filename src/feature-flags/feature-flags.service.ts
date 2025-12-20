import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from './entities/feature-flag.entity';
import { UserFeaturePermission } from './entities/user-feature-permission.entity';
import {
  CreateFeatureFlagDto,
  ToggleFeatureDto,
  UpdateFeatureFlagDto,
  GrantUserPermissionDto,
  UpdateUserPermissionDto,
  BulkGrantPermissionsDto,
} from './dto/feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(UserFeaturePermission)
    private readonly userPermissionRepository: Repository<UserFeaturePermission>,
  ) {}

  async findAll(): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.find({
      order: { featureKey: 'ASC' },
    });
  }

  async findAllEnabled(): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.find({
      where: { isEnabled: 1 },
      order: { featureKey: 'ASC' },
    });
  }

  async findByKey(featureKey: string): Promise<FeatureFlag> {
    const feature = await this.featureFlagRepository.findOne({
      where: { featureKey },
    });

    if (!feature) {
      throw new NotFoundException(`Feature flag "${featureKey}" no encontrada`);
    }

    return feature;
  }

  /**
   * Verificar si una feature está habilitada GLOBALMENTE
   * (No verifica permisos de usuario)
   */
  async isEnabled(featureKey: string): Promise<boolean> {
    try {
      const feature = await this.findByKey(featureKey);
      return feature.isEnabled === 1;
    } catch {
      return false;
    }
  }

  /**
   * NUEVO: Verificar si un usuario específico puede usar una feature
   * Este es el método principal que debes usar en el backend
   */
  async canUserAccessFeature(
    userId: number,
    featureKey: string,
  ): Promise<boolean> {
    // 1. Verificar que la feature existe y está habilitada globalmente
    const feature = await this.featureFlagRepository.findOne({
      where: { featureKey },
    });

    if (!feature || feature.isEnabled !== 1) {
      return false;
    }

    // 2. Verificar si hay un permiso específico para este usuario
    const userPermission = await this.userPermissionRepository.findOne({
      where: { userId, featureKey },
    });

    if (userPermission) {
      // Si hay permiso específico, verificar que no haya expirado
      if (userPermission.expiresAt && userPermission.expiresAt < new Date()) {
        return false;
      }
      return userPermission.isAllowed === 1;
    }

    // 3. Si no hay permiso específico, usar configuración por defecto
    return feature.defaultForUsers === 1;
  }

  /**
   * NUEVO: Obtener todas las features accesibles para un usuario
   */
  async getUserAccessibleFeatures(userId: number): Promise<FeatureFlag[]> {
    const allEnabledFeatures = await this.findAllEnabled();

    const accessibleFeatures = await Promise.all(
      allEnabledFeatures.map(async (feature) => {
        const canAccess = await this.canUserAccessFeature(
          userId,
          feature.featureKey,
        );
        return canAccess ? feature : null;
      }),
    );

    return accessibleFeatures.filter((f) => f !== null);
  }

  async create(
    createDto: CreateFeatureFlagDto,
    userId: number,
  ): Promise<FeatureFlag> {
    const exists = await this.featureFlagRepository.findOne({
      where: { featureKey: createDto.featureKey },
    });

    if (exists) {
      throw new BadRequestException(
        `Feature flag "${createDto.featureKey}" ya existe`,
      );
    }

    const feature = this.featureFlagRepository.create({
      ...createDto,
      isEnabled: createDto.isEnabled ? 1 : 0,
      defaultForUsers: createDto.defaultForUsers ? 1 : 0,
      updatedBy: userId,
    });

    return this.featureFlagRepository.save(feature);
  }

  async update(
    featureKey: string,
    updateDto: UpdateFeatureFlagDto,
    userId: number,
  ): Promise<FeatureFlag> {
    const feature = await this.findByKey(featureKey);

    Object.assign(feature, {
      ...updateDto,
      isEnabled:
        updateDto.isEnabled !== undefined
          ? updateDto.isEnabled
            ? 1
            : 0
          : feature.isEnabled,
      defaultForUsers:
        updateDto.defaultForUsers !== undefined
          ? updateDto.defaultForUsers
            ? 1
            : 0
          : feature.defaultForUsers,
      updatedBy: userId,
    });

    return this.featureFlagRepository.save(feature);
  }

  async toggle(
    featureKey: string,
    toggleDto: ToggleFeatureDto,
    userId: number,
  ): Promise<FeatureFlag> {
    const feature = await this.findByKey(featureKey);
    feature.isEnabled = toggleDto.isEnabled ? 1 : 0;
    feature.updatedBy = userId;
    return this.featureFlagRepository.save(feature);
  }

  async remove(featureKey: string): Promise<void> {
    const feature = await this.findByKey(featureKey);
    await this.featureFlagRepository.remove(feature);
  }

  async getChatbotStatus(): Promise<boolean> {
    return this.isEnabled('chatbot');
  }

  // ============================================
  // NUEVOS MÉTODOS (User Permissions)
  // ============================================

  /**
   * Otorgar o denegar permiso de una feature a un usuario
   */
  async grantUserPermission(
    dto: GrantUserPermissionDto,
    grantedBy: number,
  ): Promise<UserFeaturePermission> {
    // Verificar que la feature existe
    await this.findByKey(dto.featureKey);

    // Verificar si ya existe un permiso
    const existing = await this.userPermissionRepository.findOne({
      where: { userId: dto.userId, featureKey: dto.featureKey },
    });

    if (existing) {
      // Actualizar permiso existente
      Object.assign(existing, {
        isAllowed: dto.isAllowed ? 1 : 0,
        reason: dto.reason,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        grantedBy,
      });
      return this.userPermissionRepository.save(existing);
    }

    // Crear nuevo permiso
    const permission = this.userPermissionRepository.create({
      userId: dto.userId,
      featureKey: dto.featureKey,
      isAllowed: dto.isAllowed ? 1 : 0,
      reason: dto.reason,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      grantedBy,
    });

    return this.userPermissionRepository.save(permission);
  }

  /**
   * Actualizar permiso existente
   */
  async updateUserPermission(
    userId: number,
    featureKey: string,
    dto: UpdateUserPermissionDto,
  ): Promise<UserFeaturePermission> {
    const permission = await this.userPermissionRepository.findOne({
      where: { userId, featureKey },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permiso no encontrado para usuario ${userId} y feature ${featureKey}`,
      );
    }

    Object.assign(permission, {
      isAllowed:
        dto.isAllowed !== undefined
          ? dto.isAllowed
            ? 1
            : 0
          : permission.isAllowed,
      reason: dto.reason !== undefined ? dto.reason : permission.reason,
      expiresAt:
        dto.expiresAt !== undefined
          ? new Date(dto.expiresAt)
          : permission.expiresAt,
    });

    return this.userPermissionRepository.save(permission);
  }

  /**
   * Revocar permiso (eliminar registro)
   */
  async revokeUserPermission(
    userId: number,
    featureKey: string,
  ): Promise<void> {
    const permission = await this.userPermissionRepository.findOne({
      where: { userId, featureKey },
    });

    if (!permission) {
      throw new NotFoundException(`Permiso no encontrado`);
    }

    await this.userPermissionRepository.remove(permission);
  }

  /**
   * Obtener todos los permisos de un usuario
   */
  async getUserPermissions(userId: number): Promise<UserFeaturePermission[]> {
    return this.userPermissionRepository.find({
      where: { userId },
      relations: ['feature', 'granter'],
      order: { featureKey: 'ASC' },
    });
  }

  /**
   * Obtener todos los usuarios con permiso para una feature
   */
  async getFeaturePermissions(
    featureKey: string,
  ): Promise<UserFeaturePermission[]> {
    return this.userPermissionRepository.find({
      where: { featureKey },
      relations: ['user', 'granter'],
      order: { userId: 'ASC' },
    });
  }

  /**
   * Otorgar/denegar permiso a múltiples usuarios de una vez
   */
  async bulkGrantPermissions(
    dto: BulkGrantPermissionsDto,
    grantedBy: number,
  ): Promise<UserFeaturePermission[]> {
    // Verificar que la feature existe
    await this.findByKey(dto.featureKey);

    const permissions = await Promise.all(
      dto.userIds.map((userId) =>
        this.grantUserPermission(
          {
            userId,
            featureKey: dto.featureKey,
            isAllowed: dto.isAllowed,
            reason: dto.reason,
          },
          grantedBy,
        ),
      ),
    );

    return permissions;
  }

  /**
   * Limpiar permisos expirados
   */
  async cleanExpiredPermissions(): Promise<number> {
    const expired = await this.userPermissionRepository
      .createQueryBuilder('permission')
      .where('permission.expiresAt IS NOT NULL')
      .andWhere('permission.expiresAt < :now', { now: new Date() })
      .getMany();

    if (expired.length > 0) {
      await this.userPermissionRepository.remove(expired);
    }

    return expired.length;
  }
}
