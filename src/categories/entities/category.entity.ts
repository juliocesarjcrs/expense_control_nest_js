import { Content } from 'src/entity/entityBase';
import { Income } from 'src/incomes/entities/income.entity';
import { Subcategory } from 'src/subcategories/entities/subcategory.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity({ name: 'categories' })
export class Category extends Content {
  @Column('varchar', { length: 200 })
  name: string;

  @Column({ nullable: true })
  icon: string;

  @Column('tinyint', { default: 0, comment: '0-Gastos, 1-Ingresos' })
  type: number;

  @Column('int', { default: 0 })
  budget: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  userId: number;

  @OneToMany(() => Subcategory, (subcategory) => subcategory.categoryId, {
    cascade: true,
  })
  subcategories: Subcategory[];

  @OneToMany(() => Income, (income) => income.categoryId, {
    cascade: true,
  })
  incomes: Income[];
}
