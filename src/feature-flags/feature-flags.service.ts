import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from './entities/feature-flag.entity';
import {
  CreateFeatureFlagDto,
  ToggleFeatureDto,
  UpdateFeatureFlagDto,
} from './dto/feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
  ) {}

  /**
   * Obtener todas las feature flags
   */
  async findAll(): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.find({
      order: { featureKey: 'ASC' },
    });
  }

  /**
   * Obtener solo las features activas (para el frontend)
   */
  async findAllEnabled(): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.find({
      where: { isEnabled: 1 },
      order: { featureKey: 'ASC' },
    });
  }

  /**
   * Obtener una feature flag por su key
   */
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
   * Verificar si una feature está habilitada
   */
  async isEnabled(featureKey: string): Promise<boolean> {
    try {
      const feature = await this.findByKey(featureKey);
      return feature.isEnabled === 1;
    } catch {
      // Si no existe la feature, por defecto retorna false
      return false;
    }
  }

  /**
   * Crear una nueva feature flag
   */
  async create(
    createDto: CreateFeatureFlagDto,
    userId: number,
  ): Promise<FeatureFlag> {
    // Verificar si ya existe
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
      updatedBy: userId,
    });

    return this.featureFlagRepository.save(feature);
  }

  /**
   * Actualizar una feature flag
   */
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
      updatedBy: userId,
    });

    return this.featureFlagRepository.save(feature);
  }

  /**
   * Toggle (activar/desactivar) una feature flag
   */
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

  /**
   * Eliminar una feature flag (opcional, solo si es necesario)
   */
  async remove(featureKey: string): Promise<void> {
    const feature = await this.findByKey(featureKey);
    await this.featureFlagRepository.remove(feature);
  }

  /**
   * Obtener el estado del chatbot (caso específico)
   */
  async getChatbotStatus(): Promise<boolean> {
    return this.isEnabled('chatbot');
  }
}
