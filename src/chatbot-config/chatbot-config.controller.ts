import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  ValidationPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChatbotConfigService } from './chatbot-config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { ChatbotConfiguration } from './entities/chatbot-configuration.entity';
import { ChatbotConfigHistory } from './entities/chatbot-config-history.entity';
import {
  AllConfigsResult,
  ConfigHistoryQuery,
  GetAllConfigsQuery,
  ImportConfigItem,
  ImportConfigsResult,
} from './interfaces/chatbot-config.interfaces';

@Controller('chatbot/config')
@UseGuards(JwtAuthGuard)
export class ChatbotConfigController {
  constructor(private readonly chatbotConfigService: ChatbotConfigService) {}

  /**
   * Obtiene todas las configuraciones (para admin panel)
   */
  @Get()
  async getAllConfigs(
    @Request() req: AuthenticatedRequest,
    @Query() query: GetAllConfigsQuery,
  ): Promise<AllConfigsResult<ChatbotConfiguration>> {
    // TODO: Agregar validación de rol admin
    // if (req.user.role !== 1) throw new ForbiddenException('Admin only');

    return this.chatbotConfigService.getAllConfigs(
      query.includeInactive === 'true',
    );
  }

  /**
   * Obtiene una configuración específica por key
   */
  @Get(':configKey')
  async getConfigByKey(
    @Param('configKey') configKey: string,
  ): Promise<{ data: ChatbotConfiguration }> {
    const config = await this.chatbotConfigService.getConfigEntity(configKey);

    if (!config) {
      throw new NotFoundException(`Configuration ${configKey} not found`);
    }

    return { data: config };
  }

  /**
   * Crea una nueva configuración
   */
  @Post()
  @HttpCode(201)
  async createConfig(
    @Request() req: AuthenticatedRequest,
    @Body(ValidationPipe) createDto: CreateConfigDto,
  ): Promise<ChatbotConfiguration> {
    // TODO: Validar rol admin
    return this.chatbotConfigService.createConfig(createDto, req.user.id);
  }

  /**
   * Actualiza una configuración existente
   */
  @Patch(':configKey')
  async updateConfig(
    @Request() req: AuthenticatedRequest,
    @Param('configKey') configKey: string,
    @Body(ValidationPipe) updateDto: UpdateConfigDto,
  ): Promise<ChatbotConfiguration> {
    // TODO: Validar rol admin

    return this.chatbotConfigService.updateConfig(
      configKey,
      updateDto.config_value,
      req.user.id,
      updateDto.change_reason,
    );
  }

  /**
   * Activa/desactiva una configuración
   */
  @Patch(':configKey/toggle')
  async toggleActive(
    @Request() req: AuthenticatedRequest,
    @Param('configKey') configKey: string,
    @Body('is_active') isActive: boolean,
  ): Promise<ChatbotConfiguration> {
    return this.chatbotConfigService.toggleActive(
      configKey,
      isActive,
      req.user.id,
    );
  }

  /**
   * Obtiene el historial de cambios de una configuración
   */
  @Get(':configKey/history')
  async getConfigHistory(
    @Param('configKey') configKey: string,
    @Query() query: ConfigHistoryQuery,
  ): Promise<AllConfigsResult<ChatbotConfigHistory>> {
    return this.chatbotConfigService.getConfigHistory(
      configKey,
      query.limit ? parseInt(query.limit, 10) : 10,
    );
  }

  /**
   * Revierte a una versión anterior
   */
  @Post(':configKey/revert/:historyId')
  async revertToVersion(
    @Request() req: AuthenticatedRequest,
    @Param('configKey') configKey: string,
    @Param('historyId') historyId: string,
  ): Promise<ChatbotConfiguration> {
    return this.chatbotConfigService.revertToVersion(
      configKey,
      parseInt(historyId, 10),
      req.user.id,
    );
  }

  /**
   * Invalida el cache manualmente (útil después de cambios masivos)
   */
  @Post('cache/invalidate')
  async invalidateCache(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string; timestamp: string }> {
    await this.chatbotConfigService.invalidateCache();
    return {
      success: true,
      message: 'Cache invalidated and reloaded',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Elimina una configuración (soft delete - la marca como inactiva)
   */
  @Delete(':configKey')
  async deleteConfig(
    @Request() req: AuthenticatedRequest,
    @Param('configKey') configKey: string,
  ): Promise<ChatbotConfiguration> {
    return this.chatbotConfigService.deleteConfig(configKey, req.user.id);
  }

  /**
   * Exporta todas las configuraciones (backup)
   */
  @Get('export/all')
  async exportConfigs(@Request() req: AuthenticatedRequest) {
    return this.chatbotConfigService.exportAllConfigs();
  }

  /**
   * Importa configuraciones desde backup
   */
  @Post('import')
  async importConfigs(
    @Request() req: AuthenticatedRequest,
    @Body() configs: ImportConfigItem[],
  ): Promise<ImportConfigsResult> {
    return this.chatbotConfigService.importConfigs(configs, req.user.id);
  }
}
