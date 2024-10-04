import { Test, TestingModule } from '@nestjs/testing';
import { LoansResolver } from './loans.resolver';
import { LoansService } from './loans.service';
import { CreateLoanInput } from './dto/inputs/create-loan.input';

describe('LoansResolver', () => {
  let resolver: LoansResolver;

  const mockLoan = {
    id: 1,
    type: 0,
    amount: 1000,
    userId: 1,
    commentary: 'Test loan',
    createdAt: '2023-01-03T12:11:06.792Z',
    user: 1
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
  };

  const mockLoansService = {
    findAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansResolver,
        {
          provide: LoansService,
          useValue: mockLoansService,
        },
      ],
    }).compile();

    resolver = module.get<LoansResolver>(LoansResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('loans', () => {
    it('should return all loans for a given user', async () => {
      mockLoansService.findAll.mockResolvedValue([mockLoan]);

      const result = await resolver.loans(mockUser);

      expect(mockLoansService.findAll).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual([mockLoan]);
    });
  });

  describe('createLoan', () => {
    it('should create and return a new loan', async () => {
      const createLoanInput: CreateLoanInput = {
        type: 0,
        amount: 1000,
        commentary: 'Test loan',
        userId: 1
      };

      const savedLoan = { ...mockLoan, id: 1 };

      mockLoansService.create.mockResolvedValue(savedLoan);

      const result = await resolver.createLoan(mockUser, createLoanInput);

      expect(mockLoansService.create).toHaveBeenCalledWith({
        ...createLoanInput,
        userId: mockUser.id,
      });
      expect(result).toEqual(savedLoan);
    });
  });

  describe('deleteLoan', () => {
    it('should delete a loan and return true', async () => {
      mockLoansService.remove.mockResolvedValue(true);

      const result = await resolver.deleteLoan(1);

      expect(mockLoansService.remove).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should return false if loan is not found', async () => {
      mockLoansService.remove.mockResolvedValue(false);

      const result = await resolver.deleteLoan(1);

      expect(mockLoansService.remove).toHaveBeenCalledWith(1);
      expect(result).toBe(false);
    });
  });
});
