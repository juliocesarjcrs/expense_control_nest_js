export interface GetAllConfigsQuery {
  includeInactive?: string;
}

export interface ConfigHistoryQuery {
  limit?: string;
}

export interface ImportConfigItem {
  config_key: string;
  config_value: Record<string, unknown>;
  description?: string;
}

export interface AllConfigsResult<T> {
  data: T[];
  count: number;
}

export interface ImportConfigsResult {
  created: number;
  updated: number;
  errors: string[];
}
