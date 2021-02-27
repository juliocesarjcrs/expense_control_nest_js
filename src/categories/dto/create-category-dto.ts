import { IsInt, IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { IsUserAlreadyExist } from 'src/utils/validations/validation';

export class CreateCategoryDto {
  @IsString()
  readonly name: string;
  readonly icon: string;
  @IsInt()
  @IsUserAlreadyExist({
    message: 'userId $value already exists. Choose another userId.',
  })
  readonly userId: User;
}
