import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { CheckCodeDto } from './dto/check-code-dto';
import { RecoveryPasswordDto } from './dto/recovery-password-dto';
import { User } from 'src/users/entities/user.entity';
import { LoginDto } from './dto/login-dto';
import { UpdatedUserDto } from 'src/users/dto/updated-user-dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findOneEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }

  async login(user: LoginDto) {
    const email = user.email;
    const pass = user.password;
    const userFound = await this.usersService.findOneEmail(email);
    if (!userFound) {
      throw new BadRequestException('Email or password incorrect');
    }
    const valid = await bcrypt.compare(pass, userFound.password);
    if (!valid) {
      throw new BadRequestException('Email or password incorrect');
    }
    const { password, recoveryCode, ...safeUser } = userFound;
    return {
      access_token: this.getTokenForUser(userFound),
      user: safeUser,
    };
  }

  public getTokenForUser(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const userFound = await this.usersService.findOneEmail(
      forgotPasswordDto.email,
    );
    if (!userFound) {
      throw new BadRequestException('Email not found');
    }
    const randomNumber = this.generateRandomNumber(1000, 9999);
    const user = await this.usersService.update(userFound.id, {
      recoveryCode: randomNumber,
    } as UpdatedUserDto);
    const email = await this.mailService.sendUserCode(userFound, randomNumber);
    const { password, recoveryCode, ...safeUser } = user;
    return { user: safeUser, email };
  }

  async checkRecoveryCode(idUser: number, checkCodeDto: CheckCodeDto) {
    const userFound = await this.usersService.findOne(idUser);
    if (!userFound) {
      throw new UnauthorizedException('User not found');
    }
    if (userFound.recoveryCode !== parseInt(checkCodeDto.recoveryCode)) {
      throw new BadRequestException('Código expiró o es incorrecto');
    }
    return { checkCode: true };
  }

  async setPasswordRecovery(
    idUser: number,
    recoveryPasswordDto: RecoveryPasswordDto,
  ) {
    const userFound = await this.usersService.findOne(idUser);
    if (!userFound) {
      throw new UnauthorizedException('User not found');
    }
    const passBycrypt = await this.usersService.getHash(
      recoveryPasswordDto.password,
    );
    const user = await this.usersService.update(userFound.id, {
      password: passBycrypt,
    } as UpdatedUserDto);
    const { password, recoveryCode, ...safeUser } = user;
    return { user: safeUser };
  }

  generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }
}
