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
import { ChatbotService } from './services/chatbot.service';
import { AIModelManagerService } from './services/ai-model-manager.service';
import { CreateAIModelDto } from './dto/create-ai-model.dto';
import { UpdateAIModelDto } from './dto/update-ai-model.dto';
import { ToolsRegistry } from './tools/tools.registry';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly aiModelManager: AIModelManagerService,
    private readonly toolsRegistry: ToolsRegistry,
  ) {}

  @Get('conversations')
  async getRecentConversations(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.chatbotService.getRecentConversations({
      userId: req.user.id,
      limit: limit ? parseInt(limit, 10) : 0,
      page: page ? parseInt(page, 10) : 1,
    });
  }

  @Get('conversations/:id/messages')
  async getConversationHistory(
    @Request() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.chatbotService.getConversationHistory({
      conversationId: +conversationId,
      userId: req.user.id,
      limit: limit ? parseInt(limit, 10) : 0,
      page: page ? parseInt(page, 10) : 1,
    });
  }

  @Post('conversation')
  async createConversation(@Request() req: AuthenticatedRequest) {
    return this.chatbotService.createConversation(req.user.id);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @Request() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
  ) {
    return this.chatbotService.deleteConversation(+conversationId, req.user.id);
  }

  @Post('message')
  async sendMessage(
    @Request() req: AuthenticatedRequest,
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

  /**
   * ENDPOINTS ADMINISTRATIVOS - Gestión de modelos
   */

  @Post('models')
  @HttpCode(201)
  async createModel(@Body() createModelDto: CreateAIModelDto) {
    const payload = {
      ...createModelDto,
      is_active: createModelDto.is_active ?? true,
    };
    return this.aiModelManager.addNewModel(payload);
  }

  @Patch('models/:id')
  async updateModel(
    @Param('id') modelId: string,
    @Body() updateDto: UpdateAIModelDto,
  ) {
    return this.aiModelManager.updateModelConfiguration(+modelId, updateDto);
  }

  @Delete('models/:id')
  async deleteModel(@Param('id') modelId: string) {
    return this.aiModelManager.updateModelConfiguration(+modelId, {
      is_active: false,
    });
  }

  @Post('models/reload')
  async reloadModels(): Promise<{ message: string }> {
    await this.aiModelManager.reloadModels();
    return { message: 'Models reloaded successfully' };
  }

  // Ver nota del hallazgo 1: ruta inalcanzable hoy, pendiente de decisión.
  @Get('models')
  async getModels() {
    const models = await this.aiModelManager.getAllModels();
    return { data: models };
  }

  @Get('models/tool-calls')
  async getToolCallsAnalysis(@Query('limit') limit?: string) {
    return this.aiModelManager.getToolCallsAnalysis(
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('models/errors')
  async getModelErrors(@Query('limit') limit?: string) {
    return this.aiModelManager.getModelErrors(limit ? parseInt(limit, 10) : 20);
  }

  @Get('analytics/interactions')
  async getInteractionLogs(@Query('limit') limit?: string) {
    return this.chatbotService.getInteractionAnalysis(
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('analytics/tool-stats')
  async getToolStats() {
    return this.chatbotService.getToolUsageStats();
  }

  @Post('tools/reload')
  @HttpCode(200)
  async reloadToolsConfig() {
    await this.toolsRegistry.reloadToolsConfig();

    const activeTools = this.toolsRegistry.getAllToolDefinitions();

    return {
      success: true,
      message: 'Tools configuration reloaded successfully',
      timestamp: new Date().toISOString(),
      totalActive: activeTools.length,
      tools: activeTools.map((t) => ({
        name: t.function.name,
        priority: this.toolsRegistry.getToolConfig(t.function.name)?.priority,
      })),
    };
  }

  @Get('tools/config')
  async getToolsConfig() {
    const allTools = this.toolsRegistry.getAllToolDefinitions();

    return {
      total: allTools.length,
      tools: allTools.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description.trim().substring(0, 100) + '...',
        config: this.toolsRegistry.getToolConfig(tool.function.name),
      })),
    };
  }

  @Get('tools/:toolName/status')
  async getToolStatus(@Param('toolName') toolName: string) {
    const config = this.toolsRegistry.getToolConfig(toolName);
    const isActive = this.toolsRegistry.hasTool(toolName);

    return {
      toolName,
      exists: config !== undefined,
      isActive,
      config,
    };
  }
}
