import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user-dto';
import { Public } from 'src/utils/decorators/custumDecorators';
import { ChangePasswordDto } from './dto/change-password-dto';
import { UpdatedUserDto } from './dto/updated-user-dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('image', { dest: './uploads/users' }))
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
    @Res() response,
  ) {
    console.log(image);
    if (image) {
      createUserDto.image = image.path;
    }
    const user = await this.userService.createUser(createUserDto);
    response.status(HttpStatus.CREATED).json(user);
  }

  @Get()
  async getAll(@Res() response) {
    const listUsers = await this.userService.findAll();
    response.status(HttpStatus.OK).json(listUsers);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image', { dest: './uploads/users' }))
  updateUser(
    @UploadedFile() image: Express.Multer.File,
    @Param('id') id: number,
    @Body() updatedUserDto: UpdatedUserDto,
  ) {
    console.log('image post', image);
    if (image) {
      updatedUserDto.image = image.path;
    }
    return this.userService.update(+id, updatedUserDto);
  }

  @Put('change-password/:id')
  update(@Param('id') id: string, @Body() data: ChangePasswordDto) {
    return this.userService.changePassword(id, data);
  }
}
