import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RecoveryPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  readonly password: string;
}
