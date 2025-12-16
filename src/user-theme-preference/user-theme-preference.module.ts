import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserThemePreferenceController } from './user-theme-preference.controller';
import { UserThemePreferenceService } from './user-theme-preference.service';
import { UserThemePreference } from './entities/user-theme-preference.entity';
import { ThemeConfigModule } from '../theme-config/theme-config.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserThemePreference]), ThemeConfigModule],
  controllers: [UserThemePreferenceController],
  providers: [UserThemePreferenceService],
  exports: [UserThemePreferenceService],
})
export class UserThemePreferenceModule {}
