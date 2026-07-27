import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
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
  login(@Body() user: LoginDto) {
    return this.authService.login(user);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Get('check-recovery-code/:id')
  checkRecoveryCode(@Param('id') id: string, @Query() query: CheckCodeDto) {
    return this.authService.checkRecoveryCode(+id, query);
  }

  @Public()
  @Put('password-recovery/:id')
  setPasswordRecovery(
    @Param('id') id: string,
    @Body() recoveryPasswordDto: RecoveryPasswordDto,
  ) {
    return this.authService.setPasswordRecovery(+id, recoveryPasswordDto);
  }
}
