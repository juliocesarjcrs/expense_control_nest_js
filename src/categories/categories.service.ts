import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category-dto';
import { UpdateCategoryDto } from './dto/updated-category.dto';

import * as moment from 'moment';
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
    CategoryEntity.type = createCategoryDto.type;

    return this.categoriesRepository.save(CategoryEntity);
  }
  async findAll(userId: number, query) {
    const type = query ? query.type : 0;
    return this.categoriesRepository.find({
      where: { userId: userId, type },
      order: { name: 'ASC' },
    });
  }

  async findAllWithSubcategories(userId: number, query) {
    const queryDate = query ? query.date : null;
    const data = await this.categoriesRepository.find({
      relations: ['subcategories', 'subcategories.expenses'],
      where: { userId: userId, type: 0 },
      order: { name: 'ASC' },
    });
    let totalGeneraly = 0;
    const dataFormat = data.map((e) => {
      const { totalCategory, subcategories } = this.mappingSubcategories(
        e.subcategories,
        queryDate,
      );
      totalGeneraly += totalCategory;
      return { ...e, subcategories, total: totalCategory };
    });
    return { data: dataFormat, total: totalGeneraly };
  }
  mappingSubcategories(array, queryDate) {
    let totalCategory = 0;
    const subcategories = array.map((m) => {
      const filtrado = this.filterByDate(m.expenses, queryDate);
      const total = this.calculateTotal(filtrado);
      totalCategory += total;
      return { ...m, expenses: filtrado, total };
    });
    return { totalCategory, subcategories };
  }
  filterByDate(array, queryDate) {
    const start = moment(queryDate).startOf('month');
    const end = moment(queryDate).endOf('month');
    const filter = array.filter((e) => {
      const actual = moment(e.date);
      if (actual >= start && actual <= end) {
        return true;
      } else {
        return false;
      }
    });
    return filter;
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

  async findAllTypeIncome(userId: number, query) {
    const queryDate = query ? query.date : null;
    const data = await this.categoriesRepository.find({
      relations: ['incomes'],
      where: { userId: userId, type: 1 },
      order: { name: 'ASC' },
    });
    let totalGeneraly = 0;
    const dataFormat = data.map((category) => {
      const filtrado = this.filterByDate(category.incomes, queryDate);
      const total = this.calculateTotalIncomes(filtrado);
      totalGeneraly += total;
      return { ...category, total };
    });
    return { data: dataFormat, total: totalGeneraly };
  }
  calculateTotalIncomes(myArray) {
    return myArray.reduce(
      (acu: number, val) => acu + parseFloat(val.amount),
      0,
    );
  }
}
