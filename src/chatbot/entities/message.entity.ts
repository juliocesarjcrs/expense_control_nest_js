import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Content } from 'src/entity/entityBase';

@Entity({ name: 'messages' })
export class Message extends Content {
  @Column('text')
  content: string;

  @Column()
  role: string;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
