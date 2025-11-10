import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { DatesService } from 'src/utils/dates/dates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [CategoriesService, DatesService],
  controllers: [CategoriesController],
  exports: [CategoriesService], // IMPORTANTE: exportarlo
})
export class CategoriesModule {}
