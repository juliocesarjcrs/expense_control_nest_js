import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import { Column, JoinColumn, ManyToOne } from 'typeorm';

export class Subcategory extends Content {
  @Column('varchar', { length: 200 })
  name: string;

  @Column({ nullable: true })
  icon: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  userId: User;
}
