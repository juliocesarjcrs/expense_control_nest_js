import { Test, TestingModule } from '@nestjs/testing';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';

describe('IncomesController', () => {
  let controller: IncomesController;
  const mockIncomesService = {};
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomesController],
      providers: [IncomesService],
    })
      .overrideProvider(IncomesService)
      .useValue(mockIncomesService)
      .compile();

    controller = module.get<IncomesController>(IncomesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
