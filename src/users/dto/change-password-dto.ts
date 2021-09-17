import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Match } from 'src/utils/decorators/match.decorator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  @MinLength(3)
  readonly currentlyPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  readonly password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Match('password', {
    message: 'Las contraseñas no coinciden',
  })
  readonly passwordComfirm: string;
}
