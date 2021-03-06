import { Injectable } from '@nestjs/common';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { Subcategory } from './entities/subcategory.entity';

@Injectable()
export class SubcategoriesService {
  create(createSubcategoryDto: CreateSubcategoryDto) {
    const SubcategoryEntity = new Subcategory();
    SubcategoryEntity.name = createSubcategoryDto.name;
    SubcategoryEntity.icon = createSubcategoryDto.icon;
    SubcategoryEntity.userId = createSubcategoryDto.userId;
    return 'This action adds a new subcategory';
  }

  findAll() {
    return `This action returns all subcategories`;
  }

  findOne(id: number) {
    return `This action returns a #${id} subcategory`;
  }

  update(id: number, updateSubcategoryDto: UpdateSubcategoryDto) {
    return `This action updates a #${id} subcategory`;
  }

  remove(id: number) {
    return `This action removes a #${id} subcategory`;
  }
}
