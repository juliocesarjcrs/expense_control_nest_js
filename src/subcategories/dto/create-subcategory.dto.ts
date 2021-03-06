import { isInt, IsString } from 'class-validator';

export class CreateSubcategoryDto {
  @IsString()
  readonly name: string;
  readonly icon: string;
  @isInt()
  // @Validate(IsUserAlreadyExist)
  // @IsUserAlreadyExist()
  readonly userId: User;
}
