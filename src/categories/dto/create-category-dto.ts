import { IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';

export class CreateCategoryDto {
  @IsString()
  readonly name: string;
  readonly icon: string;
  readonly userId: User;
}
