import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Category } from 'src/categories/entities/category.entity';
import { TYPE_STORAGE_IMAGE } from 'src/config/global.env';
import { StorageMethodFactory } from 'src/files/factory/storage-method.factory';
import { FilesService } from 'src/files/files.service';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
const StorageMethodFactoryProvider = {
  provide: 'IStorageMethod',
  useFactory: () => {
    return StorageMethodFactory.createStorageType(TYPE_STORAGE_IMAGE);
  },
};
@Module({
  imports: [TypeOrmModule.forFeature([User, Category])],
  providers: [
    UsersService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    FilesService,
    StorageMethodFactoryProvider
  ],
  exports: [UsersService],
})
export class UsersModule {}
