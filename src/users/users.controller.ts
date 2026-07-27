import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user-dto';
import { Public } from 'src/utils/decorators/custumDecorators';
import { ChangePasswordDto } from './dto/change-password-dto';
import { UpdatedUserDto } from './dto/updated-user-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestWithFileValidation } from 'src/files/interfaces/request-with-file-validation.interface';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @UploadedFile() image: Express.Multer.File | undefined,
    @Body() createUserDto: CreateUserDto,
  ) {
    if (image) {
      createUserDto.image = image.path;
    }
    return this.userService.createUser(createUserDto);
  }

  @Get()
  getAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  updateUser(
    @Req() req: RequestWithFileValidation,
    @UploadedFile() image: Express.Multer.File | undefined,
    @Param('id') id: string,
    @Body() updatedUserDto: UpdatedUserDto,
  ) {
    return this.userService.updateProfile(+id, updatedUserDto, req, image);
  }
  @Put('change-password/:id')
  update(@Param('id') id: string, @Body() data: ChangePasswordDto) {
    return this.userService.changePassword(+id, data);
  }
}
