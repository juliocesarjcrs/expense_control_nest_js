/**
 * Mensaje de chat extendido
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

/**
 * Respuesta extendida del AI Provider con soporte para tool calls
 */
export interface ChatMessageResponse {
  threadId?: string;
  outputText: string | null;
  role: 'assistant' | 'user' | 'system';
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  finishReason?:
    | 'length'
    | 'stop'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call';
}
