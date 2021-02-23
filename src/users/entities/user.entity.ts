/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Category } from 'src/categories/entities/category.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  image: string;

  @Column()
  email: string;

  @Column()
  password: string;

  // @OneToMany( type => Category , category => category.id)
  // children: Category[];

  @OneToMany(() => Category, category => category.id)
  categories: Category[];
}
