import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user-dto';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password-dto';
import { UpdatedUserDto } from './dto/updated-user-dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const userFound = await this.usersRepository.findOne(id);
    if (!userFound) {
      throw new HttpException('Id not found', HttpStatus.BAD_REQUEST);
    }
    return userFound;
  }
  async findOneEmail(email: string): Promise<User | undefined> {
    return await this.usersRepository.findOne({
      where: { email: email },
    });
  }
  async createUser(newUser: CreateUserDto): Promise<User> {
    const exitsEmail = await this.findOneEmail(newUser.email);
    if (exitsEmail) {
      throw new HttpException(
        'There is already a user with this email',
        HttpStatus.BAD_REQUEST,
      );
    }

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

  async update(id: number, UpdatedUserDto: UpdatedUserDto): Promise<User> {
    const UserFound = await this.usersRepository.findOne(id);
    if (!UserFound)
      throw new HttpException('Id not found', HttpStatus.NOT_FOUND);
    const editUser = Object.assign(UserFound, UpdatedUserDto);
    return this.usersRepository.save(editUser);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async changePassword(id: string, newData: ChangePasswordDto) {
    const userFound = await this.findOne(+id);
    if (!userFound) {
      throw new HttpException('user not found', HttpStatus.NOT_FOUND);
    }

    const valid = await bcrypt.compare(
      newData.currentlyPassword,
      userFound.password,
    );
    if (!valid) {
      throw new HttpException('password incorrect', HttpStatus.BAD_REQUEST);
    }
    const hash = await this.getHash(newData.password);
    const editUser = Object.assign(userFound, { password: hash });
    return await this.usersRepository.save(editUser);
  }

  async getHash(newPassword: string) {
    const salt = await bcrypt.genSalt();
    const password = newPassword;
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }
}
