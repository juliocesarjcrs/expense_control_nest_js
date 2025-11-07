import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import {
  AIProvider,
  AIModelConfig,
  ProviderHealth,
  ModelInfo,
} from '../interfaces/ai-provider.interface';
import { AIModelHealthLog } from '../entities/ai-model-health-log.entity';
import { ToolDefinition } from '../interfaces/tool.interface';
import {
  ChatMessage,
  ChatMessageResponse,
} from '../interfaces/chat-message.interface';

export class OpenRouterProvider implements AIProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private openai: OpenAI;
  private config: AIModelConfig;
  private errorCount = 0;

  constructor(
    config: AIModelConfig,
    private healthLogRepository: Repository<AIModelHealthLog>,
    private modelId: number,
  ) {
    this.config = config;
    this.openai = new OpenAI({
      baseURL: config.api_endpoint,
      apiKey: config.api_key,
    });
  }

  async generateResponse(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    toolChoice:
      | 'auto'
      | 'none'
      | { type: 'function'; function: { name: string } } = 'auto',
    iteration: number = 1,
  ): Promise<ChatMessageResponse> {
    const startTime = Date.now();
    try {
      const formattedMessages = this.formatMessagesForOpenAI(messages);

      const completion = await this.openai.chat.completions.create({
        model: this.config.model_name,
        messages: formattedMessages,
        tools: this.config.supports_tools && tools ? tools : undefined,
        tool_choice:
          this.config.supports_tools && tools ? toolChoice : undefined,
        temperature: this.config.temperature,
        max_tokens: this.config.max_tokens,
      });

      const choice = completion.choices[0];
      this.errorCount = 0;

      // ✅ Log con información detallada
      await this.logHealthEvent(
        'success',
        Date.now() - startTime,
        undefined,
        iteration,
        this.config.supports_tools,
        completion.usage?.total_tokens,
        choice.finish_reason,
      );

      return {
        outputText: choice.message.content,
        role: 'assistant',
        toolCalls: this.extractToolCalls(choice.message),
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      this.errorCount++;

      // ✅ Log de error con contexto
      await this.logHealthEvent(
        'error',
        Date.now() - startTime,
        error.message,
        iteration,
        this.config.supports_tools,
      );

      this.logger.error('Error calling OpenRouter API:', error.message);
      throw error;
    }
  }

  async validateModel(): Promise<boolean> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model_name,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10,
      });
      return !!completion.choices[0];
    } catch (error) {
      this.logger.warn(`Model validation failed: ${error.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const isHealthy = await this.validateModel();
      const responseTime = Date.now() - startTime;

      return {
        isHealthy,
        lastTestedAt: new Date(),
        responseTime,
        errorCount: this.errorCount,
        healthScore: isHealthy ? Math.max(0, 1 - this.errorCount * 0.1) : 0,
      };
    } catch (error) {
      return {
        isHealthy: false,
        lastTestedAt: new Date(),
        responseTime: Date.now() - startTime,
        errorCount: this.errorCount + 1,
        healthScore: 0,
      };
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.config.id,
      name: this.config.model_name,
      provider: this.config.provider_type,
      maxTokens: this.config.max_tokens,
      supportsTools: this.config.supports_tools,
    };
  }

  private formatMessagesForOpenAI(messages: ChatMessage[]): any[] {
    return messages.map((msg) => {
      if (msg.role === 'system' || msg.role === 'user') {
        return {
          role: msg.role,
          content: msg.content,
        };
      }

      if (msg.role === 'assistant') {
        const formattedMsg: any = {
          role: 'assistant',
        };

        // ✅ Si hay tool_calls, content debe ser null
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          formattedMsg.content = null;
          formattedMsg.tool_calls = msg.tool_calls;
        } else {
          formattedMsg.content = msg.content || null;
        }

        return formattedMsg;
      }

      if (msg.role === 'tool') {
        // ✅ Convertir tool results a mensajes user
        return {
          role: 'user',
          content: `Tool result from ${msg.name}:\n${msg.content}`,
        };
      }

      return {
        role: 'user',
        content: msg.content,
      };
    });
  }

  private extractToolCalls(message: any): any[] {
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return [];
    }

    return message.tool_calls
      .filter((tc) => tc.type === 'function')
      .map((tc) => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));
  }

  private async logHealthEvent(
    status: 'success' | 'error' | 'timeout' | 'rate_limit',
    responseTime: number,
    errorMessage?: string,
    iteration?: number,
    supportsTools?: boolean,
    tokenCount?: number,
    finishReason?: string,
  ): Promise<void> {
    try {
      await this.healthLogRepository.save({
        aiModelId: this.modelId,
        status,
        response_time: responseTime,
        error_message: errorMessage,
        iteration: iteration || 1,
        supports_tools: supportsTools || false,
        token_count: tokenCount,
        finish_reason: finishReason,
        createdAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to log health event:', error);
    }
  }
}
