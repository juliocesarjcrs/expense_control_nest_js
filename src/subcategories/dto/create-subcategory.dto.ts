import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';

export class CreateSubcategoryDto {
  @IsString()
  readonly name: string;
  readonly icon: string;
  readonly userId: number;
  @IsNotEmpty()
  @IsInt()
  // @Validate(IsUserAlreadyExist)
  // @IsUserAlreadyExist()
  readonly categoryId: number;
}
