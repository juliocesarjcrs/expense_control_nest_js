// src/feature-flags/entities/user-feature-permission.entity.ts
import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import { FeatureFlag } from './feature-flag.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'user_feature_permissions' })
@Index(['userId', 'featureKey'], { unique: true })
export class UserFeaturePermission extends Content {
  @Column({ name: 'user_id' })
  userId: number;

  @Column('varchar', { name: 'feature_key', length: 100 })
  featureKey: string;

  @Column('tinyint', { name: 'is_allowed', default: 1 })
  isAllowed: number;

  @Column({ name: 'granted_by', nullable: true })
  grantedBy: number | null;

  @Column('varchar', { length: 500, nullable: true })
  reason: string | null;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feature_key', referencedColumnName: 'featureKey' })
  feature: FeatureFlag;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'granted_by' })
  granter: User;
}
