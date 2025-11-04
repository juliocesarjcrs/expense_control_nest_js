import { Module } from '@nestjs/common';
import { StorageMethodFactory } from './factory/storage-method.factory';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { TYPE_STORAGE_IMAGE } from 'src/config/global.env';

const StorageMethodFactoryProvider = {
  provide: 'IStorageMethod',
  useFactory: () => {
    return StorageMethodFactory.createStorageType(TYPE_STORAGE_IMAGE);
  },
};
@Module({
  controllers: [FilesController],
  providers: [FilesService, StorageMethodFactoryProvider],
  exports: [FilesService],
})
export class FilesModule {}
