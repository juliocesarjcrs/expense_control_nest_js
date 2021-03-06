import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { Public } from './utils/decorators/custumDecorators';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Public()
  @Post('auth/login')
  async login(@Request() req) {
    const user = { ...req.body };
    console.log('USER', user);

    return this.authService.login(user);
  }
}
