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

  @OneToMany(() => Category, (category) => category.id)
  categories: Category[];
}
