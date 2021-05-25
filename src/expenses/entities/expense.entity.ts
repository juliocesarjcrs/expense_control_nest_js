import { Content } from 'src/entity/entityBase';
import { Subcategory } from 'src/subcategories/entities/subcategory.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
@Entity()
export class Expense extends Content {
  @Column('int')
  cost: number;

  @Column('varchar', { length: 200, nullable: true })
  commentary: string;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Subcategory, (subcategory) => subcategory.expenses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subcategory_id' })
  subcategoryId: number;
}
