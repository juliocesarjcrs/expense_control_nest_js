import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Public } from 'src/utils/decorators/custumDecorators';
import { imageFileFilter } from 'src/utils/helpers/file-helper';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Public()
  @Get('load')
  seeUploadedFile(@Query() query, @Res() res: Response) {
    return this.filesService.laodFile(query.file, res);
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
    // console.log('file', file);
    return this.filesService.saveFile(res, file, req);
  }
}
