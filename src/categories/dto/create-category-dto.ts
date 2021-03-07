import { IsInt, IsString, Validate } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
// import { IsUserAlreadyExist } from 'src/utils/validations/validation';

export class CreateCategoryDto {
  @IsString()
  readonly name: string;
  readonly icon: string;
  readonly userId: number;
  // @IsInt()
  // // @Validate(IsUserAlreadyExist)
  // // @IsUserAlreadyExist()
  // readonly userId: User;
}
