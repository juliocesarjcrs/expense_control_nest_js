import { TYPE_STORAGE } from 'src/config/global.env';
import { IStorageMethod } from './interfaces/storage-method.interface';
import { AwsStorage } from './types/aws-storage';

export class StorageMethodFactory {
  static createStorageType(type: String): IStorageMethod {
    if (type === TYPE_STORAGE.AWS) {
      return new AwsStorage();
    }

    throw new Error('Invalid payment method type.');
  }
}
