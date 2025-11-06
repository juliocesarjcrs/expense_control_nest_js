import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';

@Entity('chatbot_configurations')
export class ChatbotConfiguration extends Content {
  @Column({ type: 'varchar', length: 100, unique: true })
  config_key: string;

  @Column({ type: 'json' })
  config_value: any;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'int', nullable: true })
  updated_by: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updated_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: User;
}
