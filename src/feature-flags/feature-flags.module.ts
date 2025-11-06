import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlag } from './entities/feature-flag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureFlag])],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService], // Para usar en otros módulos
})
export class FeatureFlagsModule {}
