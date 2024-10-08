import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import * as fs from 'fs';

import multer from 'multer';
import { diskStorage } from 'multer';

import path from 'path';
import {
  imageFileFilter,
} from 'src/utils/helpers/file-helper';
import { uuid } from 'uuidv4';
import { IStorageMethod } from './factory/interfaces/storage-method.interface';

@Injectable()
export class FilesService {
  constructor(
    @Inject('IStorageMethod')
    private readonly storageMethod: IStorageMethod,
  ) { }
  fileExists(path: string): boolean {
    if (fs.existsSync(path)) {
      return true;
    }
    return false;
  }

  async laodFile(path: string) {
    // if (!path) {
    //   throw new HttpException('File not found', HttpStatus.BAD_REQUEST);
    // }
    // const existFile = this.fileExists(path);
    // if (!existFile) {
    //   throw new HttpException('File not found', HttpStatus.BAD_REQUEST);
    // }
    // return res.sendFile(path, { root: './' });
    const result = await this.storageMethod.readFile(path);
    return result;
  }

  saveFile(res: any, file: Express.Multer.File, @Req() req: Request) {
    if (!file || res.fileValidationError) {
      throw new HttpException('File not found', HttpStatus.BAD_REQUEST);
    }
    const storage = diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/prueba');
      },

      // By default, multer removes file extensions so let's add them back
      filename: function (req, file, cb) {
        cb(
          null,
          file.fieldname + '-' + Date.now() + path.extname(file.originalname),
        );
      },
    });

    // storage: diskStorage({
    //   destination: './uploads/prueba',
    //   filename: (req, file, cb) => {
    //     const fileExtension: string = path.extname(file.originalname);
    //     const fileName: string = file.originalname;
    //     // const fileName: string = uuidv4() + fileExtension;
    //     cb(null, fileName);
    //   },
    // }),

    const upload = multer({
      storage: storage,
      fileFilter: imageFileFilter,
    }).single('profile_pic');

    upload(req, res, function (err) {
      // req.file contains information of uploaded file
      // req.body contains information of text fields, if there were any

      if (res.fileValidationError) {
        return res.send(res.fileValidationError);
      } else if (!req.file) {
        return res.send('Please select an image to upload');
      } else if (err instanceof multer.MulterError) {
        return res.send(err);
      } else if (err) {
        return res.send(err);
      }

      // Display uploaded image for user validation
      res.send(
        `You have uploaded this image: <hr/><img src="${req.file.path}" width="500"><hr /><a href="./">Upload another image</a>`,
      );
    });
    console.log('filse_service', file);

    return file.originalname;
    // const buffer = file.buffer;
    // const stream = intoStream(file.buffer);
    // const stream = intoStream(file.buffer).pipe(process.stdout);
  }

  async saveFileAwsS3(
    res: any,
    file: Express.Multer.File,
    fileNameOld: string | null
  ) {
    if (!file || res.fileValidationError) {
      throw new HttpException('File not found', HttpStatus.BAD_REQUEST);
    }
    let nameFile = fileNameOld;
    if (!fileNameOld) {
      const ext = file.originalname.split('.').slice(-1)[0];
      nameFile = `${uuid()}.${ext}`;
    }
    this.storageMethod.setFilename(nameFile);
    const result = await this.storageMethod.uploadFile(file);
    return result;

  }

  async deleteFile(path: string) {
    await this.storageMethod.deleteFile(path);
  }
}
