import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export abstract class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
