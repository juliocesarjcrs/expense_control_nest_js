import { Module } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { SubcategoriesController } from './subcategories.controller';

@Module({
  controllers: [SubcategoriesController],
  providers: [SubcategoriesService]
})
export class SubcategoriesModule {}
