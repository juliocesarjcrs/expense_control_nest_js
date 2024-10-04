import { IsOptional, IsString } from 'class-validator';

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
