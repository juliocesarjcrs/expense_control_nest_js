import { Entity, Column, OneToMany } from 'typeorm';
import { Message } from './message.entity';
import { Content } from 'src/entity/entityBase';

@Entity({ name: 'conversations' })
export class Conversation extends Content {
  @Column()
  provider: string;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
