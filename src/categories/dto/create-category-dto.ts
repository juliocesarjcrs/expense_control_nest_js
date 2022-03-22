import { IsInt, IsOptional, IsString, Validate } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
// import { IsUserAlreadyExist } from 'src/utils/validations/validation';

export class CreateCategoryDto {
  @IsString()
  readonly name: string;
  @IsString()
  readonly icon: string;
  // @IsInt()
  // readonly type: number;
  @IsOptional()
  readonly type: number;

  @IsOptional()
  readonly budget: number;

  readonly userId: number;
  // @IsInt()
  // // @Validate(IsUserAlreadyExist)
  // // @IsUserAlreadyExist()
  // readonly userId: User;
}
