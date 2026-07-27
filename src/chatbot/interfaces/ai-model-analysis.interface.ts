export interface ToolCallAnalysisEntry {
  modelName: string;
  toolCalls: unknown;
  responseTime: number;
  timestamp: Date;
}

export interface ModelErrorEntry {
  modelName: string;
  error: string;
  responseTime: number;
  timestamp: Date;
  iteration: number;
  supportsTools: boolean;
  tokenCount: number | null;
  finishReason: string | null;
}
