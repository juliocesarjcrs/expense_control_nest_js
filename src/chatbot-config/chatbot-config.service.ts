import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ChatbotConfiguration } from './entities/chatbot-configuration.entity';
import { CreateConfigDto } from './dto/create-config.dto';
import { ChatbotConfigHistory } from './entities/chatbot-config-history.entity';
import {
  AllConfigsResult,
  ImportConfigItem,
  ImportConfigsResult,
} from './interfaces/chatbot-config.interfaces';

@Injectable()
export class ChatbotConfigService implements OnModuleInit {
  private readonly logger = new Logger(ChatbotConfigService.name);
  private configCache: Map<string, unknown> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hora
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(
    @InjectRepository(ChatbotConfiguration)
    private configRepo: Repository<ChatbotConfiguration>,
    @InjectRepository(ChatbotConfigHistory)
    private historyRepo: Repository<ChatbotConfigHistory>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadAllConfigs();
    this.logger.log('✅ Chatbot configurations loaded into cache');
  }

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

  async getConfig<T = unknown>(configKey: string): Promise<T> {
    const timestamp = this.cacheTimestamps.get(configKey);

    if (!timestamp || Date.now() - timestamp > this.CACHE_TTL) {
      await this.reloadConfig(configKey);
    }

    return this.configCache.get(configKey) as T;
  }

  /**
   * Obtiene la entidad completa (para admin panel)
   */
  async getConfigEntity(
    configKey: string,
  ): Promise<ChatbotConfiguration | null> {
    return this.configRepo.findOne({
      where: { config_key: configKey },
      relations: { updatedByUser: true },
    });
  }

  /**
   * Obtiene todas las configuraciones (admin)
   */
  async getAllConfigs(
    includeInactive: boolean = false,
  ): Promise<AllConfigsResult<ChatbotConfiguration>> {
    const where: FindOptionsWhere<ChatbotConfiguration> = includeInactive
      ? {}
      : { is_active: true };

    const configs = await this.configRepo.find({
      where,
      order: { config_key: 'ASC' },
      relations: { updatedByUser: true },
    });

    return {
      data: configs,
      count: configs.length,
    };
  }

  private async reloadConfig(configKey: string): Promise<void> {
    const config = await this.configRepo.findOne({
      where: { config_key: configKey, is_active: true },
    });

    if (config) {
      this.configCache.set(configKey, config.config_value);
      this.cacheTimestamps.set(configKey, Date.now());
    }
  }

  async createConfig(
    createDto: CreateConfigDto,
    userId: number,
  ): Promise<ChatbotConfiguration> {
    const existing = await this.configRepo.findOne({
      where: { config_key: createDto.config_key },
    });

    if (existing) {
      throw new ConflictException(
        `Configuration ${createDto.config_key} already exists`,
      );
    }

    const config = this.configRepo.create({
      ...createDto,
      updated_by: userId,
    });

    const saved = await this.configRepo.save(config);

    if (saved.is_active) {
      this.configCache.set(saved.config_key, saved.config_value);
      this.cacheTimestamps.set(saved.config_key, Date.now());
    }

    this.logger.log(`✅ Created new config: ${saved.config_key}`);

    return saved;
  }

  async updateConfig(
    configKey: string,
    newValue: Record<string, unknown>,
    userId: number,
    changeReason?: string,
  ): Promise<ChatbotConfiguration> {
    const existing = await this.configRepo.findOne({
      where: { config_key: configKey },
    });

    if (!existing) {
      throw new NotFoundException(`Configuration ${configKey} not found`);
    }

    await this.historyRepo.save({
      config_id: existing.id,
      config_key: configKey,
      previous_value: existing.config_value,
      new_value: newValue,
      changed_by: userId,
      change_reason: changeReason || 'Manual update',
    });

    existing.config_value = newValue;
    existing.version += 1;
    existing.updated_by = userId;
    const updated = await this.configRepo.save(existing);

    if (updated.is_active) {
      this.configCache.set(configKey, newValue);
      this.cacheTimestamps.set(configKey, Date.now());
    }

    this.logger.log(
      `✅ Config ${configKey} updated to version ${updated.version}`,
    );

    return updated;
  }

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

  async invalidateCache(): Promise<void> {
    await this.loadAllConfigs();
    this.logger.log('🔄 Cache invalidated and reloaded');
  }

  async getConfigHistory(
    configKey: string,
    limit: number = 10,
  ): Promise<AllConfigsResult<ChatbotConfigHistory>> {
    const history = await this.historyRepo.find({
      where: { config_key: configKey },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: { changedByUser: true },
    });

    return {
      data: history,
      count: history.length,
    };
  }

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
      `Reverted to version from ${historyEntry.createdAt.toISOString()}`,
    );
  }

  async deleteConfig(
    configKey: string,
    userId: number,
  ): Promise<ChatbotConfiguration> {
    return this.toggleActive(configKey, false, userId);
  }

  async exportAllConfigs(): Promise<{
    exported_at: string;
    count: number;
    configurations: Array<{
      config_key: string;
      config_value: Record<string, unknown>;
      description: string;
      version: number;
    }>;
  }> {
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

  async importConfigs(
    configs: ImportConfigItem[],
    userId: number,
  ): Promise<ImportConfigsResult> {
    const results: ImportConfigsResult = {
      created: 0,
      updated: 0,
      errors: [],
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
        results.errors.push(
          `${config.config_key}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    await this.invalidateCache();

    return results;
  }
}
