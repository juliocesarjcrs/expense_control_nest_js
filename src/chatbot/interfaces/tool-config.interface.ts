export interface ToolsConfig {
  tools: ToolConfig[];
}

export interface ToolConfig {
  name: string;
  is_active: boolean;
  priority: number;
  description?: string;
  executor: string;
  cache_ttl_seconds?: number;
  parameters?: ToolParameters;
}

export interface ToolParameters {
  type: string;
  properties: Record<string, ToolParameterProperty>;
  required: string[];
}

export interface ToolParameterProperty {
  type: string;
  format?: string;
  description?: string;
  enum?: (string | number)[];
  default?: any;
}
