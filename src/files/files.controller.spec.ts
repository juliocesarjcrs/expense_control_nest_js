import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  const mockFilesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [FilesService],
    })
      .overrideProvider(FilesService)
      .useValue(mockFilesService)
      .compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
