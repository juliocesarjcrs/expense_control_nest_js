import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Category } from 'src/categories/entities/category.entity';
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
  readonly category: Category;
  readonly user: User;

}

