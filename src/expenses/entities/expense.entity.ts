import { Content } from 'src/entity/entityBase';
import { Subcategory } from 'src/subcategories/entities/subcategory.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ExpenseNature } from '../enums/expense-nature.enum';
@Entity()
export class Expense extends Content {
  @Column('int')
  cost: number;

  @Column({
    type: 'enum',
    enum: ExpenseNature,
    default: ExpenseNature.OPERATIONAL,
    name: 'nature',
  })
  nature: ExpenseNature;

  @Column('varchar', { length: 200, nullable: true })
  commentary: string;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'subcategory_id', nullable: false })
  subcategoryId: number;

  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 36,
    nullable: true,
    unique: true,
  })
  idempotencyKey: string | null;

  @ManyToOne(() => Subcategory, (subcategory) => subcategory.expenses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: Subcategory;
}
