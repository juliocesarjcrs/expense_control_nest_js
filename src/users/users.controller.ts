import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user-dto';
import { Public } from 'src/utils/decorators/custumDecorators';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}
  @Public()
  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Res() response) {
    const user = this.userService.creteUser(createUserDto);
    response.status(HttpStatus.CREATED).json(user);
  }
  @Get()
  async getAll(@Res() response) {
    const listUsers = await this.userService.findAll();
    response.status(HttpStatus.OK).json(listUsers);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
