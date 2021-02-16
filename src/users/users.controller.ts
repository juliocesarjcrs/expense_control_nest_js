import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user-dto';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}
  @Post()
  create(@Body() createUserDto: CreateUserDto, @Res() response) {
    this.userService
      .creteUser(createUserDto)
      .then(user => {
        response.status(HttpStatus.CREATED).json(user);
      })
      .catch( () =>{
        response
        .status(HttpStatus.FORBIDDEN)
        .json({ message: 'Error en la creación' });
      });
  }
  @Get()
  getAll(@Res() response) {
    this.userService
      .findAll()
      .then((listUser) => {
        response.status(HttpStatus.OK).json(listUser);
      })
      .catch(()=>{
        response
        .status(HttpStatus.FORBIDDEN)
        .json({ message: 'Error en listar usuarios' })
      }
    
      );
  }
}
