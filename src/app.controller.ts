import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
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
  async login(@Request() req, @Res() response) {
    try {
      const user = { ...req.body };
      const data = await this.authService.login(user);
      response.status(HttpStatus.OK).json(data);
    } catch (error) {
      response
        .status(HttpStatus.FORBIDDEN)
        .json({ message: error.message || 'Error en login usuario' });
    }
  }
}
