import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'theme_config' })
export class ThemeConfig extends Content {
  @Column('varchar', { name: 'theme_name', length: 100, unique: true })
  themeName: string;

  @Column('tinyint', { name: 'is_active', default: 0 })
  isActive: number;

  @Column('json')
  colors: Record<string, string>;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
