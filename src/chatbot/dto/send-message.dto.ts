import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  @IsNotEmpty()
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
