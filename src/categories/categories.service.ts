import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category-dto';
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}
  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const CategoryEntity = new Category();
    CategoryEntity.name = createCategoryDto.name;
    CategoryEntity.icon = createCategoryDto.icon;
    CategoryEntity.userId = createCategoryDto.userId;
    return await this.categoriesRepository.save(CategoryEntity);
  }
  async findAll(): Promise<Category[]> {
    return await this.categoriesRepository.find();
  }

  async findOne(id: string): Promise<Category> {
    return await this.categoriesRepository.findOne(id);
  }
}
