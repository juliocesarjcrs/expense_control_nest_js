import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { Subcategory } from './entities/subcategory.entity';

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

  async findOne(id: number) {
    return await this.subcategoriesRepository.findOne({where: {id: id}});
  }

  async findAllByCategory(idCategory: number, query) {
    const queryWithExpenses = query ? query.withExpenses : false;
    let relations = []
    if (queryWithExpenses === 'true')  {
      relations.push('expenses')
      relations.push('category')
    }
    return await this.subcategoriesRepository.find({
      where: { categoryId: Equal(idCategory) },
      relations,
    });
  }

  async update(id: number, updateSubcategoryDto: UpdateSubcategoryDto) {
    const subcategory = await this.subcategoriesRepository.findOne({where: {id: id}});
    if (!subcategory)
      throw new HttpException('Id not found', HttpStatus.NOT_FOUND);
    const editSubcategory = Object.assign(subcategory, updateSubcategoryDto);
    return this.subcategoriesRepository.save(editSubcategory);
  }

  async remove(id: number) {
    return await this.subcategoriesRepository.delete(id);
  }
}
