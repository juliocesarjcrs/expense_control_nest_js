import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  image: string;

  @Type(() => Number)
  @IsInt()
  readonly role: number;
}
