import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import { Public } from 'src/utils/decorators/custumDecorators';
import { AuthService } from './auth.service';
import { CheckCodeDto } from './dto/check-code-dto';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { LoginDto } from './dto/login-dto';
import { RecoveryPasswordDto } from './dto/recovery-password-dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() user: LoginDto, @Res() response) {
    const data = await this.authService.login(user);
    response.status(HttpStatus.OK).json(data);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Res() response,
  ) {
    const data = await this.authService.forgotPassword(forgotPasswordDto);
    response.status(HttpStatus.OK).json(data);
  }

  @Public()
  @Get('check-recovery-code/:id')
  async checkRecoveryCode(
    @Param('id') id: number,
    @Query() query: CheckCodeDto,
    @Res() response,
  ) {
    const data = await this.authService.checkRecoveryCode(id, query);
    response.status(HttpStatus.OK).json(data);
  }

  @Public()
  @Put('password-recovery/:id')
  async setPasswordRecovery(
    @Param('id') id: number,
    @Body() recoveryPasswordDto: RecoveryPasswordDto,
    @Res() response,
  ) {
    const data = await this.authService.setPasswordRecovery(
      id,
      recoveryPasswordDto,
    );
    response.status(HttpStatus.OK).json(data);
  }
}
