import { Entity, Column, CreateDateColumn } from 'typeorm';
import { Content } from 'src/entity/entityBase';

@Entity('conversation_logs')
export class ConversationLog extends Content {
  @Column({ name: 'conversation_id', nullable: false })
  conversationId: number;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @Column({ name: 'ai_model_id', nullable: true })
  aiModelId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model_name: string;

  @Column('text')
  user_query: string; // Prompt del usuario

  @Column('text', { nullable: true })
  detected_intent: string; // Tool que decidió llamar

  @Column('json', { nullable: true })
  extracted_parameters: Record<string, any>;

  @Column('json', { nullable: true })
  tool_result: Record<string, any>;

  @Column({ type: 'int' })
  response_time: number;

  @Column({ type: 'int', default: 1 })
  iteration: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
