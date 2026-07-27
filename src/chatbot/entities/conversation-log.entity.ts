import { Entity, Column } from 'typeorm';
import { Content } from 'src/entity/entityBase';

@Entity('conversation_logs')
export class ConversationLog extends Content {
  @Column({ name: 'conversation_id', nullable: false })
  conversationId: number;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @Column({ name: 'ai_model_id', type: 'int', nullable: true })
  aiModelId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model_name: string | null;

  @Column('text')
  user_query: string;

  @Column('text', { nullable: true })
  detected_intent: string | null;

  @Column('json', { nullable: true })
  extracted_parameters: Record<string, any> | null;

  @Column('json', { nullable: true })
  tool_result: Record<string, any> | null;

  @Column({ type: 'int' })
  response_time: number;

  @Column({ type: 'int', default: 1 })
  iteration: number;
}
