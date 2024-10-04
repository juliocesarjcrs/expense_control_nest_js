import { Test, TestingModule } from '@nestjs/testing';
import { LoansService } from './loans.service';
import { Loan } from './entities/loan.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateLoanInput } from './dto/inputs/create-loan.input';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('LoansService', () => {
  let service: LoansService;

  const mockLoan = {
    id: 1,
    type: 0,
    amount: 1000,
    userId: 1,
    commentary: 'Test loan',
    createdAt: '2023-01-03T12:11:06.792Z',
    user: 1
  };

  const mockLoanRepository = {
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        {
          provide: getRepositoryToken(Loan),
          useValue: mockLoanRepository,
        },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all loans for a given user', async () => {
      const userId = 1;
      mockLoanRepository.find.mockResolvedValue([mockLoan]);

      const result = await service.findAll(userId);

      expect(mockLoanRepository.find).toHaveBeenCalledWith({
        relations: ['user'],
        where: { userId },
      });
      expect(result).toEqual([mockLoan]);
    });
  });

  describe('create', () => {
    it('should create and return a new loan', async () => {
      const createLoanInput: CreateLoanInput = {
        type: 0,
        amount: 1000,
        userId: 1,
        commentary: 'Test loan',
      };
      const savedLoan = { ...mockLoan, id: 1 };

      mockLoanRepository.save.mockResolvedValue(savedLoan);

      const result = await service.create(createLoanInput);

      expect(mockLoanRepository.save).toHaveBeenCalledWith({
        type: createLoanInput.type,
        amount: createLoanInput.amount,
        userId: createLoanInput.userId,
        commentary: createLoanInput.commentary,
      });
      expect(result).toEqual(savedLoan);
    });
  });

  describe('remove', () => {
    it('should remove a loan and return true', async () => {
      mockLoanRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1);

      expect(mockLoanRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(true);
    });

    it('should throw an exception if loan is not found', async () => {
      mockLoanRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(1)).rejects.toThrow(
        new HttpException('loan not found', HttpStatus.BAD_REQUEST),
      );
    });
  });
});