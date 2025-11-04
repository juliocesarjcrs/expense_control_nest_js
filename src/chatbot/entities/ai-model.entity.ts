import { Entity, Column, CreateDateColumn } from 'typeorm';
import { Content } from 'src/entity/entityBase';

@Entity('ai_models')
export class AIModel extends Content {
  @Column({ type: 'varchar', length: 50 })
  provider_type: 'openrouter' | 'openai' | 'custom';

  @Column({ type: 'varchar', length: 255 })
  model_name: string;

  @Column({ type: 'varchar', length: 500 })
  api_endpoint: string;

  @Column({ type: 'varchar', length: 100 })
  api_key_ref: string; // Referencia a variable env (ej: OPENROUTER_API_KEY)

  @Column({ type: 'int', default: 1 })
  priority: number; // Orden de fallback

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 2000 })
  max_tokens: number;

  @Column({ type: 'float', default: 0.7 })
  temperature: number;

  @Column({ type: 'boolean', default: true })
  supports_tools: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_tested_at: Date;

  @Column({ type: 'float', default: 1 })
  health_score: number; // 0-1

  @Column({ type: 'int', default: 0 })
  error_count: number; // Errores consecutivos

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
