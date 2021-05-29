import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { Income } from './entities/income.entity';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private IncomeRepository: Repository<Income>,
  ) {}

  create(createIncomeDto: CreateIncomeDto) {
    const IncomeEntity = new Income();
    IncomeEntity.amount = createIncomeDto.amount;
    IncomeEntity.date = createIncomeDto.date;
    IncomeEntity.userId = createIncomeDto.userId;
    IncomeEntity.categoryId = createIncomeDto.categoryId;
    return this.IncomeRepository.save(IncomeEntity);
  }

  findAll(userId: number) {
    return this.IncomeRepository.find({ where: { userId: userId } });
  }

  findOne(id: number): Promise<Income>{
    return this.IncomeRepository.findOne(id);
  }

  async update(id: number, updateIncomeDto: UpdateIncomeDto) {
    const income = await this.IncomeRepository.findOne(id);
    if (!income) throw new NotFoundException();
    const editExpense = Object.assign(income, updateIncomeDto);
    return this.IncomeRepository.save(editExpense);
  }

  remove(id: number) {
    return this.IncomeRepository.delete(id);
  }
}
