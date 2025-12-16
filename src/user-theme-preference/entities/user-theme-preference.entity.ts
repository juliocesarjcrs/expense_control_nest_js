import { Content } from 'src/entity/entityBase';
import { User } from 'src/users/entities/user.entity';
import { ThemeConfig } from 'src/theme-config/entities/theme-config.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_theme_preferences' })
@Unique(['userId']) // Un usuario solo puede tener una preferencia activa
export class UserThemePreference extends Content {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Referencia al tema predefinido (puede ser null si usa colores custom)
  @Column({ name: 'theme_id', nullable: true })
  themeId: number | null;

  @ManyToOne(() => ThemeConfig, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'theme_id' })
  theme: ThemeConfig;

  // Colores personalizados (sobrescriben los del tema si están definidos)
  @Column('json', { nullable: true })
  customColors: Record<string, string> | null;

  // Indica si el usuario prefiere usar colores custom o del tema predefinido
  @Column('tinyint', { name: 'use_custom_colors', default: 0 })
  useCustomColors: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
