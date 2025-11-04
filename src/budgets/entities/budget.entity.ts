import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
//@Index(['userId', 'year'], { unique: true })
export class Budget extends Content {
  @Column('int')
  budget: number;

  @Column({ type: 'int', nullable: false })
  year: number;

  @Column('varchar', { length: 200, nullable: false })
  city: string;

  @Column({ name: 'category_id', nullable: false })
  categoryId: number;

  @Column({ name: 'subcategory_id', nullable: false })
  subcategoryId: number;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: number;
}
