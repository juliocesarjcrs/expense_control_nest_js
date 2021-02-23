import { Category } from 'src/categories/entities/category.entity';
import { Content } from 'src/entity/entityBase';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity({ name: 'users' })
export class User extends Content {
  @Column()
  name: string;

  @Column({ nullable: true })
  image: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Category, (category) => category.id)
  categories: Category[];
}
