import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user-dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return await this.usersRepository.findOne(id);
  }
  async findOneEmail(email: string): Promise<User | undefined> {
    return await this.usersRepository.findOne({
      where: { email: email },
    });
  }
  async creteUser(newUser: CreateUserDto): Promise<User> {
    const entityUser = new User();
    entityUser.name = newUser.name;
    entityUser.image = newUser.image;
    entityUser.email = newUser.email;
    const salt = await bcrypt.genSalt();
    const password = newUser.password;
    const hash = await bcrypt.hash(password, salt);
    entityUser.password = hash;
    return await this.usersRepository.save(entityUser);
  }
  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
