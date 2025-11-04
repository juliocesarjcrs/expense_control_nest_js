import { Entity, Column, CreateDateColumn } from 'typeorm';
import { Content } from 'src/entity/entityBase';

@Entity('model_health_logs')
export class AIModelHealthLog extends Content {
  @Column({ name: 'ai_model_id', nullable: false })
  aiModelId: number;

  @Column({ type: 'varchar', length: 50 })
  status: 'success' | 'timeout' | 'error' | 'rate_limit';

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'int' })
  response_time: number; // en ms

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
