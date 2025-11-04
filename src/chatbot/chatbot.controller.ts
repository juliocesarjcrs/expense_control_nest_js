import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  Delete,
  HttpCode,
  Patch,
} from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ChatbotService } from './services/chatbot.service';
import { AIModelManagerService } from './services/ai-model-manager.service';
import { CreateAIModelDto } from './dto/create-ai-model.dto';
import { UpdateAIModelDto } from './dto/update-ai-model.dto';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly aiModelManager: AIModelManagerService,
  ) {}

  @Get('conversations')
  async getRecentConversations(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.chatbotService.getRecentConversations({
      userId: req.user.id,
      limit: limit ? parseInt(limit.toString()) : 0,
      page: page ? parseInt(page.toString()) : 1,
    });
  }
  @Get('conversations/:id/messages')
  async getConversationHistory(
    @Request() req,
    @Param('id') conversationId: number,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.chatbotService.getConversationHistory({
      conversationId: +conversationId,
      userId: req.user.id,
      limit: limit ? parseInt(limit.toString()) : 0,
      page: page ? parseInt(page.toString()) : 1,
    });
  }
  @Post('conversation')
  async createConversation(@Request() req) {
    return this.chatbotService.createConversation(req.user.id);
  }
  @Delete('conversations/:id')
  async deleteConversation(
    @Request() req,
    @Param('id') conversationId: number,
  ) {
    return this.chatbotService.deleteConversation(+conversationId, req.user.id);
  }

  @Post('message')
  async sendMessage(
    @Request() req,
    @Body(ValidationPipe) messageDto: SendMessageDto,
  ) {
    return this.chatbotService.sendMessage(
      messageDto.conversationId,
      messageDto.content,
      req.user.id,
    );
  }

  /**
   * ENDPOINTS PÚBLICOS - Estado de modelos
   */

  @Get('models/current')
  async getCurrentModel() {
    return this.chatbotService.getCurrentModelStatus();
  }

  @Get('models/health')
  async getModelsHealth() {
    return this.chatbotService.getModelsHealthStatus();
  }

  @Get('models')
  async getAllModels() {
    return this.chatbotService.getAllAvailableModels();
  }
  /**
   * ENDPOINTS ADMINISTRATIVOS - Gestión de modelos
   * Requieren rol admin (implementar en tu proyecto)
   */

  @Post('models')
  @HttpCode(201)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  async createModel(@Body() createModelDto: CreateAIModelDto) {
    const payload = {
      ...createModelDto,
      is_active: createModelDto.is_active ?? true,
    };
    return this.aiModelManager.addNewModel(payload as any);
  }

  @Patch('models/:id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  async updateModel(
    @Param('id') modelId: string,
    @Body() updateDto: UpdateAIModelDto,
  ) {
    return this.aiModelManager.updateModelConfiguration(
      parseInt(modelId),
      updateDto,
    );
  }

  @Delete('models/:id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  async deleteModel(@Param('id') modelId: string) {
    // Implementar lógica para marcar como inactivo
    return this.aiModelManager.updateModelConfiguration(parseInt(modelId), {
      is_active: false,
    });
  }

  @Post('models/reload')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  async reloadModels() {
    await this.aiModelManager.reloadModels();
    return { message: 'Models reloaded successfully' };
  }

  @Get('models')
  async getModels() {
    const models = await this.aiModelManager.getAllModels();
    return { data: models };
  }
  /**
   * ENDPOINT PARA ANALIZAR TOOL CALLS
   * Útil para optimizar prompts y definiciones de tools
   */
  @Get('models/tool-calls')
  async getToolCallsAnalysis(@Query('limit') limit?: string) {
    return this.aiModelManager.getToolCallsAnalysis(
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('models/errors')
  async getModelErrors(@Query('limit') limit?: string) {
    return this.aiModelManager.getModelErrors(limit ? parseInt(limit) : 20);
  }
  @Get('analytics/interactions')
  async getInteractionLogs(@Query('limit') limit?: string) {
    return this.chatbotService.getInteractionAnalysis(
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('analytics/tool-stats')
  async getToolStats() {
    return this.chatbotService.getToolUsageStats();
  }
}
