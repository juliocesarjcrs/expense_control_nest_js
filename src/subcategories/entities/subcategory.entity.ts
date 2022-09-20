import { Category } from 'src/categories/entities/category.entity';
import { Content } from 'src/entity/entityBase';
import { Expense } from 'src/expenses/entities/expense.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class Subcategory extends Content {
  @Column('varchar', { length: 200 })
  name: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ name: 'category_id' , nullable: false })
  categoryId: number

  @ManyToOne(() => Category, (category) => category.subcategories, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'user_id' , nullable: false })
  userId: number

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Expense, (expense) => expense.subcategories, {
    cascade: true,
  })
  expenses: Expense[];
}
