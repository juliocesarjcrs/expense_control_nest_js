import { ChatMessage, ChatMessageResponse } from './chat-message.interface';
import { ToolDefinition } from './tool.interface';

export interface AIProvider {
  /**
   * Genera una respuesta usando un modelo de IA con soporte para tools
   * @param messages - Historial de mensajes de la conversación
   * @param tools - Definiciones de herramientas disponibles
   * @param toolChoice - Estrategia de selección de tools ('auto', 'none', o una función específica)
   */
  generateResponse(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    toolChoice?:
      | 'auto'
      | 'none'
      | { type: 'function'; function: { name: string } },
  ): Promise<ChatMessageResponse>;
  validateModel(): Promise<boolean>;
  getHealthStatus(): Promise<ProviderHealth>;
  getModelInfo(): ModelInfo;
}

export interface ModelInfo {
  id: number;
  name: string;
  provider: string;
  maxTokens: number;
  supportsTools: boolean;
}

export interface ProviderHealth {
  isHealthy: boolean;
  lastTestedAt: Date;
  responseTime: number;
  errorCount: number;
  healthScore: number;
}

export interface AIModelConfig {
  id: number;
  provider_type: 'openrouter' | 'openai' | 'custom';
  model_name: string;
  api_endpoint: string;
  api_key: string;
  priority: number;
  is_active: boolean;
  max_tokens: number;
  temperature: number;
  supports_tools: boolean;
  metadata: Record<string, any>;
}
