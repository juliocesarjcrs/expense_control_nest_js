import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Request,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req,
    @Res() response,
  ) {
    createExpenseDto = { ...createExpenseDto, userId: req.user.id };
    const newExpense = await this.expensesService.create(createExpenseDto);
    response.status(HttpStatus.CREATED).json(newExpense);
  }

  @Get()
  async findAll(@Request() req, @Res() response) {
    const userId = req.user.id;
    const expenses = await this.expensesService.findAll(userId);
    response.status(HttpStatus.OK).json(expenses);
  }

  @Get('subcategory/:id')
  findAllFromSubcategory(
    @Param('id') id: string,
    @Request() req,
    @Query() query,
  ) {
    const userId = req.user.id;
    return this.expensesService.findAllFromSubcategory(userId, +id, query);
  }

  @Get('last')
  async findLast(@Request() req, @Query() query, @Res() response) {
    const userId = req.user.id;
    const expenses = await this.expensesService.findLast(userId, query);
    response.status(HttpStatus.OK).json(expenses);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(+id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(+id);
  }
}
