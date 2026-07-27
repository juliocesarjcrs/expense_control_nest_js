import { Category } from 'src/categories/entities/category.entity';
import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class Income extends Content {
  @Column('int')
  amount: number;

  @Column('varchar', { length: 200, nullable: true })
  commentary: string | null;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'category_id', nullable: false })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.incomes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
