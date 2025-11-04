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
      this.errorCount = 0; // Reset error count on success

      await this.logHealthEvent('success', Date.now() - startTime);

      return {
        outputText: choice.message.content,
        role: 'assistant',
        toolCalls: this.extractToolCalls(choice.message),
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      this.errorCount++;
      await this.logHealthEvent('error', Date.now() - startTime, error.message);
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
      if (
        msg.role === 'system' ||
        msg.role === 'user' ||
        msg.role === 'assistant'
      ) {
        return {
          role: msg.role,
          content: msg.content,
        };
      }

      if (msg.role === 'tool') {
        return {
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.tool_call_id,
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
  ): Promise<void> {
    try {
      await this.healthLogRepository.save({
        aiModelId: this.modelId,
        status,
        response_time: responseTime,
        error_message: errorMessage,
        createdAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to log health event:', error);
    }
  }
}
