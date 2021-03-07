import { IsInt, IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';

export class CreateSubcategoryDto {
  @IsString()
  readonly name: string;
  readonly icon: string;
  @IsInt()
  // @Validate(IsUserAlreadyExist)
  // @IsUserAlreadyExist()
  readonly userId: User;
}
