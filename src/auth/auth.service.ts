import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { CheckCodeDto } from './dto/check-code-dto';
import { RecoveryPasswordDto } from './dto/recovery-password-dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneEmail(email);
    if (user && pass === user.password) {
      delete user.password;
      return user;
    }
    return null;
  }
  async login(user: any) {
    const email = user.email;
    const pass = user.password;
    const userFound = await this.usersService.findOneEmail(email);
    if (!userFound) {
      throw new HttpException(
        'Email or password incorrect',
        HttpStatus.BAD_REQUEST,
      );
    }

    const valid = await bcrypt.compare(pass, userFound.password);
    if (!valid) {
      throw new HttpException(
        'Email or password incorrect',
        HttpStatus.BAD_REQUEST,
      );
    }
    const payloadSend = { user: userFound, sub: userFound.id };
    // delete userFound.password;
    return {
      access_token: this.jwtService.sign(payloadSend),
      user: userFound,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const userFound = await this.usersService.findOneEmail(
      forgotPasswordDto.email,
    );
    if (!userFound) {
      throw new HttpException('Email not found', HttpStatus.BAD_REQUEST);
    }
    const randomNumber = this.generateRandomNumber(1000, 9999);
    const editUser = Object.assign(userFound, { recoveryCode: randomNumber });
    const user = await this.usersService.update(editUser.id, editUser);
    const email = await this.mailService.sendUserCode(userFound, randomNumber);
    delete user.password;
    delete user.recoveryCode;
    return { user, email };
  }

  async checkRecoveryCode(idUser: number, checkCodeDto: CheckCodeDto) {
    const userFound = await this.usersService.findOne(idUser);
    if (!userFound) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }
    if (userFound.recoveryCode !== parseInt(checkCodeDto.recoveryCode)) {
      throw new HttpException(
        'Código expiró o es incorrecto',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { checkCode: true };
  }

  async setPasswordRecovery(
    idUser: number,
    recoveryPasswordDto: RecoveryPasswordDto,
  ) {
    const userFound = await this.usersService.findOne(idUser);
    if (!userFound) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }
    const passBycrypt = await this.usersService.getHash(
      recoveryPasswordDto.password,
    );
    const editUser = Object.assign(userFound, { password: passBycrypt });
    const user = await this.usersService.update(editUser.id, editUser);
    delete user.password;
    delete user.recoveryCode;
    return { user };
  }

  generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }
}
