import { diskStorage } from 'multer';
import { Parser } from 'json2csv';
import { Request, Response } from 'express';

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
    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      // const fileExtension: string = path.extname(file.originalname);
      const fileName: string = file.originalname;
      cb(null, fileName);
    },
  }),
};

export const downloadResourceCsv = (
  res: Response,
  fileName: string,
  fields: {
    label: string;
    value: string;
  }[],
  data: Record<string, unknown>[],
) => {
  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(data);
  res.header('Content-Type', 'text/csv');
  res.attachment(fileName);
  return res.send(csv);
};
