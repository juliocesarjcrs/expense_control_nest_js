import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetsService } from './budgets.service';
import { Budget } from './entities/budget.entity';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { BudgetFilterQuery } from './interfaces/budget-filter-query.interface';
import { DetectCityQuery } from './interfaces/detect-city-query.interface';
import { BudgetSummaryResult } from './interfaces/budget-summary-raw-row.interface';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  async create(
    @Body() createBudgetDto: CreateBudgetDto[],
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; data?: Budget[]; error?: string }> {
    const budgetsWithUserId: CreateBudgetDto[] = createBudgetDto.map(
      (budget) => ({
        ...budget,
        userId: req.user.id,
      }),
    );

    try {
      const createdBudgets =
        await this.budgetsService.createBudgets(budgetsWithUserId);
      return { success: true, data: createdBudgets };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: BudgetFilterQuery,
  ) {
    const userId = req.user.id;
    return this.budgetsService.findAll(userId, query);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<DeleteResult> {
    return this.budgetsService.remove(+id);
  }

  @Get('summary')
  getBudgetSummary(
    @Request() req: AuthenticatedRequest,
    @Query() query: BudgetFilterQuery,
  ): Promise<BudgetSummaryResult> {
    const userId = req.user.id;
    return this.budgetsService.getSummaryByCategory(userId, query);
  }

  @Get('detect-city')
  async detectCurrentCity(
    @Request() req: AuthenticatedRequest,
    @Query() query: DetectCityQuery,
  ) {
    const userId = req.user.id;
    const city = await this.budgetsService.detectCurrentCity(
      userId,
      query.year,
    );
    return {
      city,
      detected: city !== null,
    };
  }
}
