import { Request } from 'express';
import { diskStorage } from 'multer';
import path from 'path';

// export const imageFileFilter = (req: any, file: any, callback: any) => {
//   if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//     req.fileValidationError = 'only image files allowed';
//     return callback(null, false);
//   }
//   callback(null, true);
// };
export const imageFileFilter = function (
  req: any,
  file: Express.Multer.File,
  cb: any,
) {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

export const saveImageToStorage = {
  storage: diskStorage({
    destination: './uploads/prueba',
    filename: (req, file, cb) => {
      const fileExtension: string = path.extname(file.originalname);
      const fileName: string = file.originalname;
      // const fileName: string = uuidv4() + fileExtension;
      cb(null, fileName);
    },
  }),
};
