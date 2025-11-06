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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChatbotConfigService } from './chatbot-config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@Controller('chatbot/config')
@UseGuards(JwtAuthGuard)
export class ChatbotConfigController {
  constructor(private readonly chatbotConfigService: ChatbotConfigService) {}

  /**
   * Obtiene todas las configuraciones (para admin panel)
   */
  @Get()
  async getAllConfigs(
    @Request() req,
    @Query('includeInactive') includeInactive?: string,
  ) {
    // TODO: Agregar validación de rol admin
    // if (req.user.role !== 1) throw new ForbiddenException('Admin only');

    return this.chatbotConfigService.getAllConfigs(includeInactive === 'true');
  }

  /**
   * Obtiene una configuración específica por key
   */
  @Get(':configKey')
  async getConfigByKey(@Request() req, @Param('configKey') configKey: string) {
    const config = await this.chatbotConfigService.getConfigEntity(configKey);

    if (!config) {
      throw new BadRequestException(`Configuration ${configKey} not found`);
    }

    return { data: config };
  }

  /**
   * Crea una nueva configuración
   */
  @Post()
  @HttpCode(201)
  async createConfig(
    @Request() req,
    @Body(ValidationPipe) createDto: CreateConfigDto,
  ) {
    // TODO: Validar rol admin
    return this.chatbotConfigService.createConfig(createDto, req.user.id);
  }

  /**
   * Actualiza una configuración existente
   */
  @Patch(':configKey')
  async updateConfig(
    @Request() req,
    @Param('configKey') configKey: string,
    @Body(ValidationPipe) updateDto: UpdateConfigDto,
  ) {
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
    @Request() req,
    @Param('configKey') configKey: string,
    @Body('is_active') isActive: boolean,
  ) {
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
    @Query('limit') limit?: string,
  ) {
    return this.chatbotConfigService.getConfigHistory(
      configKey,
      limit ? parseInt(limit) : 10,
    );
  }

  /**
   * Revierte a una versión anterior
   */
  @Post(':configKey/revert/:historyId')
  async revertToVersion(
    @Request() req,
    @Param('configKey') configKey: string,
    @Param('historyId') historyId: string,
  ) {
    return this.chatbotConfigService.revertToVersion(
      configKey,
      parseInt(historyId),
      req.user.id,
    );
  }

  /**
   * Invalida el cache manualmente (útil después de cambios masivos)
   */
  @Post('cache/invalidate')
  async invalidateCache(@Request() req) {
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
  async deleteConfig(@Request() req, @Param('configKey') configKey: string) {
    return this.chatbotConfigService.deleteConfig(configKey, req.user.id);
  }

  /**
   * Exporta todas las configuraciones (backup)
   */
  @Get('export/all')
  async exportConfigs(@Request() req) {
    return this.chatbotConfigService.exportAllConfigs();
  }

  /**
   * Importa configuraciones desde backup
   */
  @Post('import')
  async importConfigs(@Request() req, @Body() configs: any[]) {
    return this.chatbotConfigService.importConfigs(configs, req.user.id);
  }
}
