import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user-dto';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password-dto';
import { UpdatedUserDto } from './dto/updated-user-dto';
import { FilesService } from 'src/files/files.service';
import { RequestWithFileValidation } from 'src/files/interfaces/request-with-file-validation.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private filesService: FilesService,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const userFound = await this.usersRepository.findOne({ where: { id } });
    if (!userFound) {
      throw new NotFoundException('Id not found');
    }
    return userFound;
  }

  async findOneEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findAllEmail(email: string): Promise<User[]> {
    return await this.usersRepository.find({ where: { email } });
  }

  async createUser(newUser: CreateUserDto): Promise<User> {
    const exitsEmail = await this.findOneEmail(newUser.email);
    if (exitsEmail) {
      throw new BadRequestException('There is already a user with this email');
    }

    const entityUser = new User();
    entityUser.name = newUser.name;
    entityUser.image = newUser.image;
    entityUser.email = newUser.email;
    const salt = await bcrypt.genSalt();
    entityUser.password = await bcrypt.hash(newUser.password, salt);
    return await this.usersRepository.save(entityUser);
  }

  async update(id: number, updatedUserDto: UpdatedUserDto): Promise<User> {
    const userFound = await this.usersRepository.findOne({ where: { id } });
    if (!userFound) {
      throw new NotFoundException('Id not found');
    }

    if (updatedUserDto.email) {
      const emailVarios = await this.findAllEmail(updatedUserDto.email);
      if (emailVarios.length === 1 && emailVarios[0].id !== id) {
        throw new BadRequestException('The mail already exists');
      }
    }
    const editUser = Object.assign(userFound, updatedUserDto);
    return this.usersRepository.save(editUser);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async changePassword(id: number, newData: ChangePasswordDto) {
    const userFound = await this.findOne(id);

    const valid = await bcrypt.compare(
      newData.currentlyPassword,
      userFound.password,
    );
    if (!valid) {
      throw new BadRequestException('password incorrect');
    }
    const hash = await this.getHash(newData.password);
    const editUser = Object.assign(userFound, { password: hash });
    return await this.usersRepository.save(editUser);
  }

  async getHash(newPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(newPassword, salt);
  }

  async updateProfile(
    id: number,
    updatedUserDto: UpdatedUserDto,
    req: RequestWithFileValidation,
    image?: Express.Multer.File,
  ): Promise<User> {
    const userFound = await this.usersRepository.findOne({ where: { id } });
    if (!userFound) {
      throw new NotFoundException('Id not found');
    }

    if (updatedUserDto.email) {
      const emailVarios = await this.findAllEmail(updatedUserDto.email);
      if (emailVarios.length === 1 && emailVarios[0].id !== id) {
        throw new BadRequestException('The mail already exists');
      }
    }
    if (image) {
      const keyImg = await this.filesService.saveFileAwsS3(
        req,
        image,
        userFound.image,
      );
      updatedUserDto.image = String(keyImg);
    }
    const editUser = Object.assign(userFound, updatedUserDto);
    return this.usersRepository.save(editUser);
  }
}
