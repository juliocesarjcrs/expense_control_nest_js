import { Content } from 'src/entity/entityBase';
import { Subcategory } from 'src/subcategories/entities/subcategory.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
@Entity()
export class Expense extends Content {
  @Column('int')
  cost: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Subcategory, { nullable: false })
  @JoinColumn({ name: 'subcategory_id' })
  subcategoryId: number;
}
