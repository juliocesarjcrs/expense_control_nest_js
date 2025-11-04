export class ModelHealthResponseDto {
  id: number;
  model_name: string;
  provider_type: string;
  is_active: boolean;
  health_score: number;
  error_count: number;
  response_time?: number;
  last_tested_at: Date;
}

export class CurrentModelStatusDto {
  model: {
    id: number;
    name: string;
    provider: string;
    maxTokens: number;
    supportsTools: boolean;
  };
  health: {
    isHealthy: boolean;
    responseTime: number;
    errorCount: number;
    healthScore: number;
    lastTestedAt: Date;
  };
}
