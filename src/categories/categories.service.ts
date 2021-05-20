import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category-dto';
import { UpdateCategoryDto } from './dto/updated-category.dto';
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

    return this.categoriesRepository.save(CategoryEntity);
  }
  async findAll() {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }
  async findAllWithSubcategories(userId: number) {
    const data = await this.categoriesRepository.find({
      where: { userId: userId },
      relations: ['subcategories', 'subcategories.expenses'],
      order: { name: 'ASC' },
    });
    let totalGeneraly = 0;
    const dataFormat = data.map((e) => {
      const { totalCategory, subcategories } = this.mappingSubcategories(
        e.subcategories,
      );
      totalGeneraly += totalCategory;
      return { ...e, subcategories, total: totalCategory };
    });
    return { data: dataFormat, total: totalGeneraly };
  }
  mappingSubcategories(array) {
    let totalCategory = 0;
    const subcategories = array.map((m) => {
      const total = this.calculateTotal(m.expenses);
      totalCategory += total;
      return { ...m, total };
    });
    return { totalCategory, subcategories };
  }
  calculateTotal(array) {
    return array.reduce((acu: number, val) => acu + parseFloat(val.cost), 0);
  }

  async findOne(id: number): Promise<Category> {
    return this.categoriesRepository.findOne(id);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const expense = await this.categoriesRepository.findOne(id);
    if (!expense) throw new NotFoundException();
    const editExpense = Object.assign(expense, updateCategoryDto);
    return this.categoriesRepository.save(editExpense);
  }
  async remove(id: number) {
    return this.categoriesRepository.delete(id);
  }
}
