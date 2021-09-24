import { IsNotEmpty } from 'class-validator';

export class CheckCodeDto {
  @IsNotEmpty()
  readonly recoveryCode: string;
}
