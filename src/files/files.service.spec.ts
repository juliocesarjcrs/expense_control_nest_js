import { Test, TestingModule } from '@nestjs/testing';
import { TYPE_STORAGE_IMAGE } from 'src/config/global.env';
// import { StorageMethodFactory } from './factory/storage-method.factory';
import { FilesService } from './files.service';
import { IStorageMethod } from './factory/interfaces/storage-method.interface';

describe('FilesService', () => {
  let filesService: FilesService;
  let storageMethodMock: IStorageMethod;

  beforeEach(async () => {
    storageMethodMock = {
      readFile: jest.fn(),
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      setFilename: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: 'IStorageMethod',
          useValue: storageMethodMock,
        },
      ],
    }).compile();

    filesService = moduleRef.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(filesService).toBeDefined();
  });
  // let service: FilesService;
  // const StorageMethodFactoryProvider = {
  //   provide: 'IStorageMethod',
  //   useFactory: () => {
  //     return StorageMethodFactory.createStorageType(TYPE_STORAGE_IMAGE);
  //   },
  // };
  // const mockStorageMethodFactoryProvider = {
  //   createStorageType: jest.fn().mockImplementation((type) => {
  //     let object = {};
  //     return object;
  //   }),
  // };
  // beforeEach(async () => {
  //   const module: TestingModule = await Test.createTestingModule({
  //     providers: [
  //       // FilesService,
  //       // {
  //       //   provide: StorageMethodFactory,
  //       //   useValue: mockStorageMethodFactoryProvider,
  //       // },
  //       {
  //         provide: StorageMethodFactoryProvider,
  //         useFactory: mockStorageMethodFactoryProvider,
  //       },
  //     ],
  //   }).compile();

  //   service = module.get<FilesService>(FilesService);
  // });
  // describe('fileExists', () => {
  //   it('should return true if the file exists', () => {
  //     jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
  //     expect(filesService.fileExists('/path/to/file')).toBe(true);
  //   });

  //   it('should return false if the file does not exist', () => {
  //     jest.spyOn(require('fs'), 'existsSync').mockReturnValue(false);
  //     expect(filesService.fileExists('/path/to/file')).toBe(false);
  //   });
  // });

  // describe('laodFile', () => {
  //   it('should call the readFile method of the storage method', async () => {
  //     storageMethodMock.readFile = jest.fn().mockResolvedValue('file content');
  //     const res = {};
  //     await filesService.laodFile('/path/to/file', res);
  //     expect(storageMethodMock.readFile).toHaveBeenCalledWith('/path/to/file');
  //   });
  // });

  // describe('saveFileAwsS3', () => {
  //   it('should call the uploadFile method of the storage method', async () => {
  //     const file = { originalname: 'test.jpg' };
  //     storageMethodMock.uploadFile = jest.fn().mockResolvedValue('upload result');
  //     const result = await filesService.saveFileAwsS3({}, file, null);
  //     expect(storageMethodMock.setFilename).toHaveBeenCalledWith(expect.any(String));
  //     expect(storageMethodMock.uploadFile).toHaveBeenCalledWith(file);
  //     expect(result).toBe('upload result');
  //   });

  //   it('should use the provided fileNameOld if it is not null', async () => {
  //     const file = { originalname: 'test.jpg' };
  //     storageMethodMock.uploadFile = jest.fn().mockResolvedValue('upload result');
  //     const result = await filesService.saveFileAwsS3({}, file, 'oldFileName.jpg');
  //     expect(storageMethodMock.setFilename).toHaveBeenCalledWith('oldFileName.jpg');
  //     expect(storageMethodMock.uploadFile).toHaveBeenCalledWith(file);
  //     expect(result).toBe('upload result');
  //   });
  // });
});
