import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlag } from './entities/feature-flag.entity';
import { UserFeaturePermission } from './entities/user-feature-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureFlag, UserFeaturePermission])],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService], // Para usar en otros módulos
})
export class FeatureFlagsModule {}
