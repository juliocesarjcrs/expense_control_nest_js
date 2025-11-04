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
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
    @Res() response,
  ) {
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
  @UseInterceptors(FileInterceptor('image'))
  async updateUser(
    @Res() res,
    @UploadedFile() image: Express.Multer.File,
    @Param('id') id: number,
    @Body() updatedUserDto: UpdatedUserDto,
  ) {
    const data = await this.userService.updateProfile(
      +id,
      updatedUserDto,
      res,
      image,
    );
    res.status(HttpStatus.OK).json(data);
  }

  @Put('change-password/:id')
  update(@Param('id') id: string, @Body() data: ChangePasswordDto) {
    return this.userService.changePassword(id, data);
  }
}
