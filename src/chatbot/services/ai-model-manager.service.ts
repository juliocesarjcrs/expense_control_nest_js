import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AIModel } from '../entities/ai-model.entity';
import { AIModelHealthLog } from '../entities/ai-model-health-log.entity';
import {
  AIProvider,
  AIModelConfig,
  ProviderHealth,
  ModelInfo,
} from '../interfaces/ai-provider.interface';
import { AIProviderException } from '../exceptions/ai-provider.exception';
import { OpenRouterProvider } from '../providers/openrouter.provider';

@Injectable()
export class AIModelManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AIModelManagerService.name);
  private models: AIModel[] = [];
  private currentProvider: AIProvider;
  private healthCheckInterval: NodeJS.Timer;
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
  private readonly HEALTH_SCORE_THRESHOLD = 0.5;

  constructor(
    @InjectRepository(AIModel)
    private aiModelRepository: Repository<AIModel>,
    @InjectRepository(AIModelHealthLog)
    private healthLogRepository: Repository<AIModelHealthLog>,
    private configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.initialize();
    } catch (error) {
      this.logger.error(
        'Failed to initialize AI Model Manager on module init:',
        error,
      );
      // No lanzar error aquí para permitir que la app inicie sin modelos
    }
  }

  async onModuleDestroy(): Promise<void> {
    // No hay timers que limpiar en uso familiar
    // if (this.healthCheckInterval) {
    //   clearInterval(this.healthCheckInterval);
    // }
  }

  async initialize(): Promise<void> {
    await this.loadModelsFromDatabase();
    await this.selectBestProvider();
    // ❌ ELIMINADO: this.startHealthCheckLoop(); - No necesario para uso familiar
    this.logger.log('AI Model Manager initialized successfully');
  }

  async loadModelsFromDatabase(): Promise<void> {
    try {
      const models = await this.aiModelRepository.find({
        where: { is_active: true },
        order: { priority: 'ASC' },
      });
      this.models = models;
      this.logger.log(`Loaded ${models.length} active AI models`);
    } catch (error) {
      this.logger.error('Failed to load models from database:', error);
      this.models = [];
    }
  }

  async selectBestProvider(): Promise<AIProvider> {
    if (this.models.length === 0) {
      throw new AIProviderException('No AI models available in database');
    }

    for (const model of this.models) {
      try {
        const provider = await this.createProviderInstance(model);
        const isValid = await provider.validateModel();

        if (isValid) {
          this.currentProvider = provider;
          this.logger.log(
            `Selected provider: ${model.model_name} (${model.provider_type})`,
          );
          return provider;
        }
      } catch (error) {
        this.logger.warn(
          `Model ${model.model_name} validation failed: ${error.message}`,
        );
      }
    }

    throw new AIProviderException(
      'No healthy AI providers available after checking all models',
    );
  }

  private async createProviderInstance(model: AIModel): Promise<AIProvider> {
    const apiKey = this.configService.get<string>(model.api_key_ref);

    if (!apiKey) {
      throw new Error(`API key not found for reference: ${model.api_key_ref}`);
    }

    const config: AIModelConfig = {
      id: model.id,
      provider_type: model.provider_type,
      model_name: model.model_name,
      api_endpoint: model.api_endpoint,
      api_key: apiKey,
      priority: model.priority,
      is_active: model.is_active,
      max_tokens: model.max_tokens,
      temperature: model.temperature,
      supports_tools: model.supports_tools,
      metadata: model.metadata || {},
    };

    switch (model.provider_type) {
      case 'openrouter':
        return new OpenRouterProvider(
          config,
          this.healthLogRepository,
          model.id,
        );
      // case 'openai':
      //   return new OpenAIProvider(config, this.healthLogRepository, model.id);
      default:
        throw new Error(`Unknown provider type: ${model.provider_type}`);
    }
  }

  async getCurrentProvider(): Promise<AIProvider> {
    if (!this.currentProvider) {
      await this.selectBestProvider();
    }
    return this.currentProvider;
  }
  /**
   * Intenta con el siguiente provider disponible cuando el actual falla
   * Se llama automáticamente desde el catch del generateResponse
   */
  async switchToNextProvider(): Promise<void> {
    this.logger.warn('Switching to next available provider due to failure...');

    const currentModelId = this.currentProvider?.getModelInfo().id;
    const currentIndex = this.models.findIndex((m) => m.id === currentModelId);

    // Buscar siguiente modelo activo
    for (let i = currentIndex + 1; i < this.models.length; i++) {
      try {
        const provider = await this.createProviderInstance(this.models[i]);
        const isValid = await provider.validateModel();

        if (isValid) {
          this.currentProvider = provider;
          this.logger.log(
            `Switched to fallback provider: ${this.models[i].model_name}`,
          );

          // Registrar el cambio en logs
          await this.healthLogRepository.save({
            aiModelId: this.models[i].id,
            status: 'success',
            response_time: 0,
            error_message: `Fallback activated from model ${currentModelId}`,
            createdAt: new Date(),
          });

          return;
        }
      } catch (error) {
        this.logger.warn(
          `Fallback model ${this.models[i].model_name} also failed`,
        );
      }
    }

    throw new AIProviderException('No fallback providers available');
  }

  async updateModelConfiguration(
    modelId: number,
    updateDto: Partial<AIModel>,
  ): Promise<AIModel> {
    try {
      await this.aiModelRepository.update(modelId, updateDto);
      const updated = await this.aiModelRepository.findOne({
        where: { id: modelId },
      });
      await this.loadModelsFromDatabase();
      await this.selectBestProvider();
      this.logger.log(`Updated model configuration: ${modelId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update model: ${modelId}`, error);
      throw error;
    }
  }

  async addNewModel(
    createDto: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AIModel> {
    try {
      const model = this.aiModelRepository.create(createDto);
      const saved = await this.aiModelRepository.save(model);
      await this.loadModelsFromDatabase();
      this.logger.log(`New model added: ${saved.model_name}`);
      return saved;
    } catch (error) {
      this.logger.error('Failed to add new model', error);
      throw error;
    }
  }

  async getAllModels(): Promise<AIModel[]> {
    return this.aiModelRepository.find();
  }

  async getModelById(modelId: number): Promise<AIModel> {
    return this.aiModelRepository.findOne({
      where: { id: modelId },
    });
  }

  private startHealthCheckLoop(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async performHealthChecks(): Promise<void> {
    for (const model of this.models) {
      try {
        const provider = await this.createProviderInstance(model);
        const health = await provider.getHealthStatus();

        // Actualizar health en BD
        await this.aiModelRepository.update(model.id, {
          health_score: health.healthScore,
          error_count: health.errorCount,
          last_tested_at: health.lastTestedAt,
        });

        // Registrar en logs
        await this.healthLogRepository.save({
          aiModelId: model.id,
          status: health.isHealthy ? 'success' : 'error',
          response_time: health.responseTime,
          error_message: health.isHealthy ? null : 'Health check failed',
          createdAt: new Date(),
        });

        // Si el proveedor actual se degradó, cambiar
        if (
          this.currentProvider?.getModelInfo().id === model.id &&
          health.healthScore < this.HEALTH_SCORE_THRESHOLD
        ) {
          this.logger.warn(
            `Current provider degraded (score: ${health.healthScore}), switching...`,
          );
          await this.selectBestProvider();
        }
      } catch (error) {
        this.logger.error(
          `Health check failed for ${model.model_name}:`,
          error.message,
        );
      }
    }
  }

  async getHealthStatus(): Promise<AIModel[]> {
    return this.aiModelRepository.find({
      order: { priority: 'ASC' },
    });
  }

  async reloadModels(): Promise<void> {
    await this.loadModelsFromDatabase();
    await this.selectBestProvider();
    this.logger.log('Models reloaded');
  }
  /**
   * Obtiene análisis de tool calls para optimización
   */
  async getToolCallsAnalysis(limit: number = 50) {
    const logs = await this.healthLogRepository
      .createQueryBuilder('log')
      .where('log.error_message LIKE :pattern', { pattern: 'TOOL_CALLS:%' })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    // Obtener nombres de modelos
    const modelIds = [...new Set(logs.map((log) => log.aiModelId))];
    const models = await this.aiModelRepository.findBy({ id: In(modelIds) });
    const modelMap = new Map(models.map((m) => [m.id, m.model_name]));

    return logs
      .map((log) => {
        try {
          const toolCallsStr = log.error_message.replace('TOOL_CALLS: ', '');
          const toolCalls = JSON.parse(toolCallsStr);

          return {
            modelName: modelMap.get(log.aiModelId) || 'Unknown',
            toolCalls,
            responseTime: log.response_time,
            timestamp: log.createdAt,
          };
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Obtiene errores recientes para debugging
   */
  async getModelErrors(limit: number = 20) {
    const errors = await this.healthLogRepository
      .createQueryBuilder('log')
      .where('log.status = :status', { status: 'error' })
      .andWhere('log.error_message NOT LIKE :pattern', {
        pattern: 'TOOL_CALLS:%',
      })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    // Obtener nombres de modelos
    const modelIds = [...new Set(errors.map((log) => log.aiModelId))];
    const models = await this.aiModelRepository.findBy({ id: In(modelIds) });
    const modelMap = new Map(models.map((m) => [m.id, m.model_name]));

    return errors.map((log) => ({
      modelName: modelMap.get(log.aiModelId) || 'Unknown',
      error: log.error_message,
      responseTime: log.response_time,
      timestamp: log.createdAt,
      iteration: log.iteration,
      supportsTools: log.supports_tools,
      tokenCount: log.token_count,
      finishReason: log.finish_reason,
    }));
  }
}
