import { Body, Controller, Get, Post } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user-dto';

@Controller('users')
export class UsersController {
  // @Post()
  // create(@Body createuserDto: CreateUserDto ){
  //   return 'mensaje creado';
  // }
  @Get()
  getAll() {
    return 'lista users';
  }
}
