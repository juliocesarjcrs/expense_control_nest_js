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
import { Response } from 'express';
import { imageFileFilter } from 'src/utils/helpers/file-helper';
import { FilesService } from './files.service';
import { LoadFileQuery } from './interfaces/load-file-query.interface';
import { RequestWithFileValidation } from './interfaces/request-with-file-validation.interface';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get('load')
  async seeUploadedFile(
    @Query() query: LoadFileQuery,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.filesService.laodFile(query.file);
    res.status(HttpStatus.OK).json(data);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
    }),
  )
  uploadFile(
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithFileValidation,
  ): string {
    return this.filesService.saveFile(res, file, req);
  }

  @Post('upload/s3')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileAWSs3(
    @Res() res: Response,
    @Req() req: RequestWithFileValidation,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    const data = await this.filesService.saveFileAwsS3(req, file, null);
    res.status(HttpStatus.OK).json(data);
  }

  @Delete(':fileName')
  remove(@Param('fileName') fileName: string): Promise<void> {
    return this.filesService.deleteFile(fileName);
  }
}
