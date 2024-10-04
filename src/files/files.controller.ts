import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { imageFileFilter } from 'src/utils/helpers/file-helper';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  // @Public()
  @Get('load')
  async  seeUploadedFile(@Query() query, @Res() res: Response) {
    const data =  await this.filesService.laodFile(query.file);
    res.status(HttpStatus.OK).json(data);
    // return res.sendFile(query.file, { root: './' });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
    }),
  )
  uploadFile(
    @Res() res,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.filesService.saveFile(res, file, req);
  }

  @Post('upload/s3')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileAWSs3(
    @Res() res,
    @UploadedFile() file: Express.Multer.File
  ) {
    console.log(file);
    const data =  await this.filesService.saveFileAwsS3(res, file, null);
    res.status(HttpStatus.OK).json(data);
  }

  @Delete(':fileName')
  remove(@Param('fileName') fileName: string) {
    return this.filesService.deleteFile(fileName);
  }
}
