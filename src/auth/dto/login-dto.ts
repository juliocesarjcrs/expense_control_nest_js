import { IsEmail, IsNotEmpty,IsString, MaxLength } from 'class-validator';

export class LoginDto {

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  readonly password: string;
}
