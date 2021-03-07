import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Request,
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
  create(@Body() createUserDto: CreateUserDto, @Res() response) {
    this.userService
      .creteUser(createUserDto)
      .then((user) => {
        response.status(HttpStatus.CREATED).json(user);
      })
      .catch(() => {
        response
          .status(HttpStatus.FORBIDDEN)
          .json({ message: 'Error en la creación usuario' });
      });
  }
  @Get()
  getAll(@Res() response, @Request() req) {
    // console.log('req', req.user.userId);

    this.userService
      .findAll()
      .then((listUser) => {
        response.status(HttpStatus.OK).json(listUser);
      })
      .catch(() => {
        response
          .status(HttpStatus.FORBIDDEN)
          .json({ message: 'Error en listar usuarios' });
      });
  }
}
