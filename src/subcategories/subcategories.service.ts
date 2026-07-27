import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOptionsRelations, Repository } from 'typeorm';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { Subcategory } from './entities/subcategory.entity';
import { SubcategoryQueryParams } from './interfaces/subcategory-query-params.interface';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory)
    private subcategoriesRepository: Repository<Subcategory>,
  ) {}

  async create(createSubcategoryDto: CreateSubcategoryDto) {
    const SubcategoryEntity = new Subcategory();
    SubcategoryEntity.name = createSubcategoryDto.name;
    SubcategoryEntity.icon = createSubcategoryDto.icon;
    SubcategoryEntity.userId = createSubcategoryDto.userId;
    SubcategoryEntity.categoryId = createSubcategoryDto.categoryId;
    return await this.subcategoriesRepository.save(SubcategoryEntity);
  }

  findAll() {
    return `This action returns all subcategories`;
  }

  async findOne(id: number): Promise<Subcategory> {
    const subcategory = await this.subcategoriesRepository.findOne({
      where: { id },
    });
    if (!subcategory) {
      throw new NotFoundException(`Subcategory with id ${id} not found`);
    }
    return subcategory;
  }

  async findAllByCategory(idCategory: number, query: SubcategoryQueryParams) {
    const queryWithExpenses = query?.withExpenses ?? false;
    const relations: FindOptionsRelations<Subcategory> = {};
    if (queryWithExpenses === 'true') {
      relations.expenses = true;
      relations.category = true;
    }
    return await this.subcategoriesRepository.find({
      where: { categoryId: Equal(idCategory) },
      relations,
    });
  }

  async update(id: number, updateSubcategoryDto: UpdateSubcategoryDto) {
    const subcategory = await this.subcategoriesRepository.findOne({
      where: { id },
    });
    if (!subcategory) {
      throw new NotFoundException(`Subcategory with id ${id} not found`);
    }
    const editSubcategory = Object.assign(subcategory, updateSubcategoryDto);
    return this.subcategoriesRepository.save(editSubcategory);
  }

  async remove(id: number) {
    const result = await this.subcategoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Subcategory with id ${id} not found`);
    }
    return result;
  }
}
