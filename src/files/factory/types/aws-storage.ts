import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AWS_STORAGE } from 'src/config/global.env';
import { IStorageMethod } from '../interfaces/storage-method.interface';

export class AwsStorage implements IStorageMethod {
  private region: string;
  private s3Client: S3Client;
  private bucketName: string;
  private fileName: string;

  constructor() {
    this.region = AWS_STORAGE.AWS_REGION;
    this.bucketName = AWS_STORAGE.AWS_BUCKET_NAME;
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: AWS_STORAGE.AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_STORAGE.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  setFilename(value: string) {
    this.fileName = value;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: this.fileName,
        Body: file.buffer,
      };
      const results = await this.s3Client.send(new PutObjectCommand(params));
      if (results.$metadata.httpStatusCode === 200) {
        return this.fileName;
      }
      throw new HttpException('Image not saved to s3', HttpStatus.BAD_REQUEST);
    } catch (error) {
      throw new HttpException(
        'Cannot  save file inside s3',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async readFile(fileKey: string): Promise<string> {
    try {
      const urlSigned = this.getSignedFileUrl(fileKey, 3600);
      return urlSigned;
    } catch (error) {
      throw new HttpException(
        'Cannot get file inside s3',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getSignedFileUrl(fileName: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: AWS_STORAGE.AWS_BUCKET_NAME,
      Key: fileName,
    });
    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(fileName: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: AWS_STORAGE.AWS_BUCKET_NAME,
        Key: fileName,
      });
      const response = await this.s3Client.send(command);
      // if (response.$metadata.httpStatusCode === 200) {
      //
      //   return response;
      // }else if (response.$metadata.httpStatusCode === 204) {
      //   throw new HttpException('Image not found into s3', HttpStatus.NO_CONTENT);
      // }
      // throw new HttpException('Image cannnot deleted to s3', HttpStatus.BAD_REQUEST);
      return response;
    } catch (error) {
      throw new HttpException(
        'Cannot  cannnot delete file inside s3',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
