import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 200 })
  name: string;

  @Column()
  icon: string;

  // @ManyToOne(() => User, (user) => user.categories)
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
  // @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User)
  user: User;

  // @CreateDateColumn('created_at')
  // createdAt: Date;
}
