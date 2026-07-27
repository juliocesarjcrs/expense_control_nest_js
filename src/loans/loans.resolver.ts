import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Loan } from './entities/loan.entity';
import { LoansService } from './loans.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateLoanInput } from './dto/inputs/create-loan.input';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

type CurrentUserPayload = AuthenticatedRequest['user'];

@Resolver(() => Loan)
export class LoansResolver {
  constructor(private loansService: LoansService) {}

  @Query(() => [Loan])
  async loans(@CurrentUser() user: CurrentUserPayload): Promise<Loan[]> {
    return this.loansService.findAll(user.id);
  }

  @Mutation(() => Loan)
  async createLoan(
    @CurrentUser() user: CurrentUserPayload,
    @Args('createLoanInput') createLoanInput: CreateLoanInput,
  ): Promise<Loan> {
    const loanInput = { ...createLoanInput, userId: user.id };
    return await this.loansService.create(loanInput);
  }

  @Mutation(() => Boolean)
  async deleteLoan(@Args('id', { type: () => Int }) id: number) {
    return await this.loansService.remove(id);
  }
}
