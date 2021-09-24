import { Category } from 'src/categories/entities/category.entity';
import { Content } from 'src/entity/entityBase';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity({ name: 'users' })
export class User extends Content {
  @Column({ length: 120 })
  name: string;

  @Column({ nullable: true })
  image: string;

  @Column({ unique: true, length: 120 })
  email: string;

  @Column({ length: 120 })
  password: string;

  @Column({ nullable: true })
  recoveryCode: number;

  @Column('tinyint', { default: 0, comment: '0-Normal, 1-Admin' })
  role: number;

  @OneToMany(() => Category, (category) => category.id)
  categories: Category[];
}
