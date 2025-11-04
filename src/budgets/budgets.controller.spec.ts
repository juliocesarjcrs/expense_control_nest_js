import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  const mockBudgetService = {};
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [BudgetsService],
    })
      .overrideProvider(BudgetsService)
      .useValue(mockBudgetService)
      .compile();

    controller = module.get<BudgetsController>(BudgetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
