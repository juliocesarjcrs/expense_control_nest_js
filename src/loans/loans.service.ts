import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Loan } from './entities/loan.entity';
import { Repository } from 'typeorm';
import { CreateLoanInput } from './dto/inputs/create-loan.input';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
  ) {}

  async findAll(userId: number): Promise<Loan[]> {
    return await this.loanRepository.find({
      relations: ['user'],
      where: { userId },
    });
  }

  async create(createLoanInput: CreateLoanInput): Promise<Loan> {
    const loanEntity = new Loan();
    loanEntity.type = createLoanInput.type;
    loanEntity.amount = createLoanInput.amount;
    loanEntity.userId = createLoanInput.userId;
    loanEntity.commentary = createLoanInput.commentary;
    return this.loanRepository.save(loanEntity);
  }

  async remove(id: number): Promise<boolean> {
    const response = await this.loanRepository.delete(id);
    const deletedItem = response.affected > 0;
    if (!deletedItem)
      throw new HttpException('loan not found', HttpStatus.BAD_REQUEST);
    return deletedItem;
  }
}
