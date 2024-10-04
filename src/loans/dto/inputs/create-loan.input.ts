import { Field, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsNotEmpty, IsString, MaxLength } from "class-validator";

@InputType()
export class CreateLoanInput {

  @IsNotEmpty()
  @IsInt()
  @Field(() => Int)
  readonly type: number;

  @IsNotEmpty({ message: 'El monto es obligatorio'})
  @IsInt()
  @Field(() => Int)
  readonly amount: number;

  @MaxLength(200, {
    message: 'El comentario supera los 200 caracteres',
  })
  @IsString()
  @Field(() => String, { nullable: true })
  readonly commentary?: string;


  @Field(() => Int, { nullable: true })
  readonly userId: number;
}