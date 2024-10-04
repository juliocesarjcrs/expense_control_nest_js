import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Category } from 'src/categories/entities/category.entity';
import { Content } from 'src/entity/entityBase';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity({ name: 'users' })
@ObjectType()
export class User extends Content {
  @Column({ length: 120 })
  @Field(() => String)
  name: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  image: string;

  @Column({ unique: true, length: 120 })
  @Field(() => String)
  email: string;

  @Column({ length: 120 })
  @Field(() => String)
  password: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  recoveryCode: number;

  @Column('tinyint', { default: 0, comment: '0-Normal, 1-Admin' })
  @Field(() => Int, { defaultValue: 0 })
  role: number;

  // @Field(() => [Category])
  @OneToMany(() => Category, (category) => category.id)
  categories: Category[];
}
