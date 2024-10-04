import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Loan } from './entities/loan.entity';
import { LoansService } from './loans.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateLoanInput } from './dto/inputs/create-loan.input';


@Resolver(() => Loan)
export class LoansResolver {

  constructor(private loansService: LoansService) { }

  @Query(() => [Loan])
  async loans(@CurrentUser() user): Promise<Loan[]> {
    return this.loansService.findAll(user.id);
  }

  @Mutation(() => Loan)
  async createLoan(@CurrentUser() user, @Args('createLoanInput') createLoanInput: CreateLoanInput): Promise<Loan> {
    createLoanInput = { ...createLoanInput, userId: user.id };
    return await this.loansService.create(createLoanInput);
  }

  @Mutation(() => Boolean)
  async deleteLoan(
    @Args('id', { type: () => Int }) id: number
  ) {

    return await this.loansService.remove(id);
  }

}
