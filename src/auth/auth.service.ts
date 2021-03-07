import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneEmail(email);
    if (user && pass === user.password) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
  async login(user: any) {
    const email = user.email;
    const pass = user.password;
    const userFound = await this.usersService.findOneEmail(email);
    if (!userFound) {
      throw Error('Email or password incorrect');
    }

    const valid = await bcrypt.compare(pass, userFound.password);
    if (!valid) {
      throw Error('Email or password incorrect');
    }
    const payloadSend = { user: userFound, sub: userFound.id };
    return {
      access_token: this.jwtService.sign(payloadSend),
    };
  }
}
