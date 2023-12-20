import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { MailModule } from 'src/mail/mail.module';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { AuthController } from './auth.controller';
import { FilesService } from 'src/files/files.service';
import { StorageMethodFactory } from 'src/files/factory/storage-method.factory';
import { TYPE_STORAGE_IMAGE } from 'src/config/global.env';
const StorageMethodFactoryProvider = {
  provide: 'IStorageMethod',
  useFactory: () => {
    return StorageMethodFactory.createStorageType(TYPE_STORAGE_IMAGE);
  },
};
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '360d' },
    }),
    TypeOrmModule.forFeature([User, Category]),
    MailModule,
  ],
  providers: [AuthService, LocalStrategy, UsersService, JwtStrategy, FilesService, StorageMethodFactoryProvider],
  exports: [AuthService, JwtModule, UsersService],
  controllers: [AuthController],
})
export class AuthModule {}
