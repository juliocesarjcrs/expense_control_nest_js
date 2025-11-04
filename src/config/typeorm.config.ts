import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

export default class TypeOrmConfig {
  static getOrmConfig(configService: ConfigService): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: configService.get('DB_HOST'),
      port: configService.get('DB_PORT'),
      username: configService.get('DB_USER'),
      password: configService.get('DB_PASS'),
      database: configService.get('DB_NAME'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      dropSchema: Boolean(parseInt(configService.get('DB_DROP_SCHEMA'))),
      charset: 'utf8mb4',
    };
  }
  static getOrmConfigProd(configService: ConfigService): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: configService.get('DB_HOST'),
      port: configService.get('DB_PORT'),
      username: configService.get('DB_USER'),
      password: configService.get('DB_PASS'),
      database: configService.get('DB_NAME'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      dropSchema: false,
      charset: 'utf8mb4',
    };
  }
  static getOrmConfigTest(configService: ConfigService): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: configService.get('DB_HOST'),
      port: configService.get('DB_PORT'),
      username: configService.get('DB_USER'),
      password: configService.get('DB_PASS'),
      database: configService.get('DB_NAME'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      dropSchema: Boolean(parseInt(configService.get('DB_DROP_SCHEMA'))),
    };
  }
}
export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => {
    if (process.env.NODE_ENV == 'production') {
      return TypeOrmConfig.getOrmConfigProd(configService);
    } else if (process.env.NODE_ENV == 'dev') {
      return TypeOrmConfig.getOrmConfig(configService);
    } else {
      return TypeOrmConfig.getOrmConfigTest(configService);
    }
  },
  inject: [ConfigService],
};
