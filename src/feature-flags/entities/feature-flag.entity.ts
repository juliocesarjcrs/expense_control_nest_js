import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'feature_flags' })
export class FeatureFlag extends Content {
  @Column('varchar', { name: 'feature_key', length: 100, unique: true })
  featureKey: string;

  @Column('varchar', { name: 'feature_name', length: 200 })
  featureName: string;

  @Column('varchar', { length: 500, nullable: true })
  description: string;

  @Column('tinyint', { name: 'is_enabled', default: 1 })
  isEnabled: number;

  @Column('tinyint', { name: 'requires_role', nullable: true })
  requiresRole: number | null;

  @Column('tinyint', { name: 'default_for_users', default: 1 })
  defaultForUsers: number;

  @Column('json', { nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
