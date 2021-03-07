import { Category } from 'src/categories/entities/category.entity';
import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class Subcategory extends Content {
  @Column('varchar', { length: 200 })
  name: string;

  @Column({ nullable: true })
  icon: string;

  @ManyToOne(() => Category, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  categoryId: Category;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  userId: User;
}
