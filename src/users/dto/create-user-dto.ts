import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  readonly name: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(120)
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  readonly password: string;

  image: string;

  readonly recoveryCode: number;
  @IsString()
  readonly role: number;
}
