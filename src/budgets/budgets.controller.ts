import { Body, Controller, Delete, Get, Param, Post, Query, Request } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  async create(@Body() createBudgetDto: CreateBudgetDto[], @Request() req) {
    // Asigna el userId basado en la información del usuario autenticado
    const budgetsWithUserId = createBudgetDto.map(budget => ({ ...budget, userId: req.user.id }));

    try {
      const createdBudgets = await this.budgetsService.createBudgets(budgetsWithUserId);
      return { success: true, data: createdBudgets };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get()
  findAll(@Request() req, @Query() query) {
    const userId = req.user.id;
    return this.budgetsService.findAll(userId, query);
  }

    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.budgetsService.remove(+id);
    }
}
