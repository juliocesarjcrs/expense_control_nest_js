import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeConfigController } from './theme-config.controller';
import { ThemeConfigService } from './theme-config.service';
import { ThemeConfig } from './entities/theme-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeConfig])],
  controllers: [ThemeConfigController],
  providers: [ThemeConfigService],
  exports: [ThemeConfigService], // Para usar en otros módulos
})
export class ThemeConfigModule {}
