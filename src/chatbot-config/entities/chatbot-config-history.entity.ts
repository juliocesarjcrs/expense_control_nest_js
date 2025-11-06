import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Content } from 'src/entity/entityBase';
import { ChatbotConfiguration } from './chatbot-configuration.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('chatbot_config_history')
export class ChatbotConfigHistory extends Content {
  @Column({ type: 'int' })
  config_id: number;

  @Column({ type: 'varchar', length: 100 })
  config_key: string;

  @Column({ type: 'json' })
  previous_value: any;

  @Column({ type: 'json' })
  new_value: any;

  @Column({ type: 'int' })
  changed_by: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  change_reason: string;

  @ManyToOne(() => ChatbotConfiguration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'config_id' })
  configuration: ChatbotConfiguration;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changedByUser: User;
}
