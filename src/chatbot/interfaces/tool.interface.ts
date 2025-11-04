import { ChatCompletionTool } from 'openai/resources/chat';

/**
 * Definición de una herramienta que el chatbot puede usar
 */
export interface ToolDefinition {
  // id: string,
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

/**
 * Resultado de ejecutar una herramienta
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    dataSource?: string;
    queryParams?: Record<string, any>;
  };
}

/**
 * Contexto pasado al ejecutor de herramientas
 */
export interface ToolExecutionContext {
  userId: number;
  conversationId: number;
  parameters: Record<string, any>;
}

/**
 * Executor de una herramienta específica
 */
export interface ToolExecutor {
  execute(context: ToolExecutionContext): Promise<ToolExecutionResult>;
}
