import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'categories' })
export class Category extends Content {
  @Column('varchar', { length: 200 })
  name: string;

  @Column({ nullable: true })
  icon: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  userId: User;

  // @CreateDateColumn('created_at')
  // createdAt: Date;
}
