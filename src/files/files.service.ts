import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import multer, { diskStorage } from 'multer';
import path from 'path';

import { imageFileFilter } from 'src/utils/helpers/file-helper';
import { IStorageMethod } from './factory/interfaces/storage-method.interface';
import { RequestWithFileValidation } from './interfaces/request-with-file-validation.interface';

@Injectable()
export class FilesService {
  constructor(
    @Inject('IStorageMethod')
    private readonly storageMethod: IStorageMethod,
  ) {}

  fileExists(filePath: string): boolean {
    if (fs.existsSync(filePath)) {
      return true;
    }
    return false;
  }

  async laodFile(filePath: string): Promise<string> {
    const result = await this.storageMethod.readFile(filePath);
    return result;
  }

  saveFile(
    res: Response,
    file: Express.Multer.File,
    req: RequestWithFileValidation,
  ): string {
    if (!file || req.fileValidationError) {
      throw new HttpException('File not found', HttpStatus.BAD_REQUEST);
    }
    const storage = diskStorage({
      destination: function (
        _req: Request,
        _file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void,
      ) {
        cb(null, 'uploads/prueba');
      },
      filename: function (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void,
      ) {
        cb(
          null,
          file.fieldname + '-' + Date.now() + path.extname(file.originalname),
        );
      },
    });

    const upload = multer({
      storage: storage,
      fileFilter: imageFileFilter,
    }).single('profile_pic');

    upload(req, res, function (err: unknown) {
      if (req.fileValidationError) {
        return res.send(req.fileValidationError);
      } else if (!req.file) {
        return res.send('Please select an image to upload');
      } else if (err instanceof multer.MulterError) {
        return res.send(err);
      } else if (err) {
        return res.send(err);
      }

      res.send(
        `You have uploaded this image: <hr/><img src="${req.file.path}" width="500"><hr /><a href="./">Upload another image</a>`,
      );
    });

    console.log('filse_service', file);

    return file.originalname;
  }

  async saveFileAwsS3(
    req: RequestWithFileValidation,
    file: Express.Multer.File,
    fileNameOld: string | null,
  ): Promise<string> {
    if (!file || req.fileValidationError) {
      throw new HttpException('File not found', HttpStatus.BAD_REQUEST);
    }
    let nameFile: string = fileNameOld ?? '';
    if (!fileNameOld) {
      const ext = file.originalname.split('.').slice(-1)[0];
      const uniqueId = crypto.randomUUID();
      nameFile = `${uniqueId}.${ext}`;
    }
    this.storageMethod.setFilename(nameFile);
    const result = await this.storageMethod.uploadFile(file);
    return result;
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.storageMethod.deleteFile(filePath);
  }
}
