import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotConfiguration } from './entities/chatbot-configuration.entity';
import { CreateConfigDto } from './dto/create-config.dto';
import { ChatbotConfigHistory } from './entities/chatbot-config-history.entity';

@Injectable()
export class ChatbotConfigService implements OnModuleInit {
  private readonly logger = new Logger(ChatbotConfigService.name);
  private configCache: Map<string, any> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hora
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(
    @InjectRepository(ChatbotConfiguration)
    private configRepo: Repository<ChatbotConfiguration>,
    @InjectRepository(ChatbotConfigHistory)
    private historyRepo: Repository<ChatbotConfigHistory>,
  ) {}

  async onModuleInit() {
    await this.loadAllConfigs();
    this.logger.log('✅ Chatbot configurations loaded into cache');
  }

  /**
   * Carga todas las configs activas en memoria (rápido)
   */
  private async loadAllConfigs(): Promise<void> {
    const configs = await this.configRepo.find({
      where: { is_active: true },
    });

    configs.forEach((config) => {
      this.configCache.set(config.config_key, config.config_value);
      this.cacheTimestamps.set(config.config_key, Date.now());
    });

    this.logger.log(`📦 Loaded ${configs.length} configurations into cache`);
  }

  /**
   * Obtiene configuración desde cache (sin DB query) ⚡
   */
  async getConfig(configKey: string): Promise<any> {
    const timestamp = this.cacheTimestamps.get(configKey);

    // Si el cache está vencido, recargar
    if (!timestamp || Date.now() - timestamp > this.CACHE_TTL) {
      await this.reloadConfig(configKey);
    }

    return this.configCache.get(configKey);
  }

  /**
   * Obtiene la entidad completa (para admin panel)
   */
  async getConfigEntity(configKey: string): Promise<ChatbotConfiguration> {
    return this.configRepo.findOne({
      where: { config_key: configKey },
      relations: ['updatedByUser'],
    });
  }

  /**
   * Obtiene todas las configuraciones (admin)
   */
  async getAllConfigs(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { is_active: true };

    const configs = await this.configRepo.find({
      where,
      order: { config_key: 'ASC' },
      relations: ['updatedByUser'],
    });

    return {
      data: configs,
      count: configs.length,
    };
  }

  /**
   * Recarga una config específica desde DB
   */
  private async reloadConfig(configKey: string): Promise<void> {
    const config = await this.configRepo.findOne({
      where: { config_key: configKey, is_active: true },
    });

    if (config) {
      this.configCache.set(configKey, config.config_value);
      this.cacheTimestamps.set(configKey, Date.now());
    }
  }

  /**
   * Crea una nueva configuración
   */
  async createConfig(
    createDto: CreateConfigDto,
    userId: number,
  ): Promise<ChatbotConfiguration> {
    const existing = await this.configRepo.findOne({
      where: { config_key: createDto.config_key },
    });

    if (existing) {
      throw new Error(`Configuration ${createDto.config_key} already exists`);
    }

    const config = this.configRepo.create({
      ...createDto,
      updated_by: userId,
    });

    const saved = await this.configRepo.save(config);

    // Actualizar cache
    if (saved.is_active) {
      this.configCache.set(saved.config_key, saved.config_value);
      this.cacheTimestamps.set(saved.config_key, Date.now());
    }

    this.logger.log(`✅ Created new config: ${saved.config_key}`);

    return saved;
  }

  /**
   * Actualiza configuración (guarda en DB y actualiza cache)
   */
  async updateConfig(
    configKey: string,
    newValue: any,
    userId: number,
    changeReason?: string,
  ): Promise<ChatbotConfiguration> {
    const existing = await this.configRepo.findOne({
      where: { config_key: configKey },
    });

    if (!existing) {
      throw new NotFoundException(`Configuration ${configKey} not found`);
    }

    // Guardar historial
    await this.historyRepo.save({
      config_id: existing.id,
      config_key: configKey,
      previous_value: existing.config_value,
      new_value: newValue,
      changed_by: userId,
      change_reason: changeReason || 'Manual update',
    });

    // Actualizar config
    existing.config_value = newValue;
    existing.version += 1;
    existing.updated_by = userId;
    const updated = await this.configRepo.save(existing);

    // Actualizar cache inmediatamente
    if (updated.is_active) {
      this.configCache.set(configKey, newValue);
      this.cacheTimestamps.set(configKey, Date.now());
    }

    this.logger.log(
      `✅ Config ${configKey} updated to version ${updated.version}`,
    );

    return updated;
  }

  /**
   * Activa/desactiva una configuración
   */
  async toggleActive(
    configKey: string,
    isActive: boolean,
    userId: number,
  ): Promise<ChatbotConfiguration> {
    const config = await this.configRepo.findOne({
      where: { config_key: configKey },
    });

    if (!config) {
      throw new NotFoundException(`Configuration ${configKey} not found`);
    }

    config.is_active = isActive;
    config.updated_by = userId;
    const updated = await this.configRepo.save(config);

    // Actualizar cache
    if (isActive) {
      this.configCache.set(configKey, config.config_value);
      this.cacheTimestamps.set(configKey, Date.now());
    } else {
      this.configCache.delete(configKey);
      this.cacheTimestamps.delete(configKey);
    }

    this.logger.log(
      `🔄 Config ${configKey} ${isActive ? 'activated' : 'deactivated'}`,
    );

    return updated;
  }

  /**
   * Invalida cache manualmente (útil después de cambios)
   */
  async invalidateCache(): Promise<void> {
    await this.loadAllConfigs();
    this.logger.log('🔄 Cache invalidated and reloaded');
  }

  /**
   * Obtiene historial de cambios
   */
  async getConfigHistory(configKey: string, limit: number = 10) {
    const history = await this.historyRepo.find({
      where: { config_key: configKey },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['changedByUser'],
    });

    return {
      data: history,
      count: history.length,
    };
  }

  /**
   * Revierte a una versión anterior
   */
  async revertToVersion(
    configKey: string,
    historyId: number,
    userId: number,
  ): Promise<ChatbotConfiguration> {
    const historyEntry = await this.historyRepo.findOne({
      where: { id: historyId, config_key: configKey },
    });

    if (!historyEntry) {
      throw new NotFoundException('History entry not found');
    }

    return this.updateConfig(
      configKey,
      historyEntry.previous_value,
      userId,
      `Reverted to version from ${historyEntry.createdAt}`,
    );
  }

  /**
   * Elimina una configuración (soft delete)
   */
  async deleteConfig(configKey: string, userId: number) {
    return this.toggleActive(configKey, false, userId);
  }

  /**
   * Exporta todas las configuraciones
   */
  async exportAllConfigs() {
    const configs = await this.configRepo.find({
      where: { is_active: true },
    });

    return {
      exported_at: new Date().toISOString(),
      count: configs.length,
      configurations: configs.map((c) => ({
        config_key: c.config_key,
        config_value: c.config_value,
        description: c.description,
        version: c.version,
      })),
    };
  }

  /**
   * Importa configuraciones desde backup
   */
  async importConfigs(configs: any[], userId: number) {
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const config of configs) {
      try {
        const existing = await this.configRepo.findOne({
          where: { config_key: config.config_key },
        });

        if (existing) {
          await this.updateConfig(
            config.config_key,
            config.config_value,
            userId,
            'Imported from backup',
          );
          results.updated++;
        } else {
          await this.createConfig(
            {
              config_key: config.config_key,
              config_value: config.config_value,
              description: config.description,
              is_active: true,
            },
            userId,
          );
          results.created++;
        }
      } catch (error) {
        results.errors.push(`${config.config_key}: ${error.message}`);
      }
    }

    await this.invalidateCache();

    return results;
  }
}
