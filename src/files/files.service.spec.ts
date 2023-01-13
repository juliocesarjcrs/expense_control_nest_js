import { Test, TestingModule } from '@nestjs/testing';
import { TYPE_STORAGE_IMAGE } from 'src/config/global.env';
import { StorageMethodFactory } from './factory/storage-method.factory';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;
  const StorageMethodFactoryProvider = {
    provide: 'IStorageMethod',
    useFactory: () => {
      return StorageMethodFactory.createStorageType(TYPE_STORAGE_IMAGE);
    },
  };
  const mockStorageMethodFactoryProvider = {
    createStorageType: jest.fn().mockImplementation((type) => {
      let object = {};
      return object;
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // FilesService,
        // {
        //   provide: StorageMethodFactory,
        //   useValue: mockStorageMethodFactoryProvider,
        // },
        {
          provide: StorageMethodFactoryProvider,
          useFactory: mockStorageMethodFactoryProvider,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
