import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsService } from './budgets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Budget } from './entities/budget.entity';

describe('BudgetsService', () => {
  let service: BudgetsService;

  const mockBudgetsRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getRepositoryToken(Budget),
          useValue: mockBudgetsRepository,
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
