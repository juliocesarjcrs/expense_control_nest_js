import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@Entity({ name: 'loans' })
@ObjectType()
export class Loan extends Content {
  @Column('tinyint', { default: 0, comment: '0-loan, 1-lag' })
  @Field(() => Int)
  type: number;

  @Column('int', { default: 0 })
  @Field(() => Int)
  amount: number;

  @Column('varchar', { length: 200, nullable: true })
  @Field(() => String, { nullable: true })
  commentary?: string;

  @Column({ name: 'user_id', nullable: false })
  @Field(() => Int)
  userId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: number;
}
