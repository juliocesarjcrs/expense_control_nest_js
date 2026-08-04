import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['userId', 'date'], { unique: true })
export class Saving extends Content {
  @Column('int')
  saving: number;

  @Column('int')
  expense: number;

  @Column('int') operationalExpense: number; // suma de Expense.cost WHERE nature = 'operational'

  @Column('int') operationalSaving: number; // income - operationalExpense

  @Column('int')
  income: number;

  @Column('varchar', { length: 200, nullable: true })
  commentary: string | null;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
