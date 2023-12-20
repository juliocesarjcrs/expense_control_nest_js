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
import { ExpenseSearchOptions } from './  expense-search-options.interface';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    createExpenseDto = { ...createExpenseDto, userId: req.user.id };
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  async findAll(@Request() req, @Query() query, @Res() response) {
    const userId = req.user.id;
    const expenses = await this.expensesService.findAll(userId, query);
    response.status(HttpStatus.OK).json(expenses);
  }

  @Get('last/download')
  async findLastDownload(@Request() req, @Query() query, @Res() response) {
    const userId = req.user.id;
    return this.expensesService.findAllDownload(userId, response);
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
  @Get('by-subcategories')
  async findExpensesBySubcategories(
    @Request() req,
    @Query() { subcategoriesId, ...query }: ExpenseSearchOptions,
    @Res() response,
  ) {
    if (!subcategoriesId){
      return response.status(HttpStatus.BAD_REQUEST).json({
        error: 'Las subcategories son obligatorias',
      });
    }
    const userId = req.user.id;
    const incomes = await this.expensesService.findExpensesBySubcategories(
      userId,
      subcategoriesId,
      query,
    );
    response.status(HttpStatus.OK).json(incomes);
  }


  @Get('subcategory/:id/last')
  async findLastMonthsFromSubcategory(
    @Param('id') id: string,
    @Request() req,
    @Query() query,
    @Res() response,
  ) {
    const userId = req.user.id;
    const expenses = await this.expensesService.findLastMonthsFromSubcategory(
      userId,
      +id,
      query,
    );
    response.status(HttpStatus.OK).json(expenses);
  }

  @Get('category/:id')
  async findLastMonthsFromOnlyCategory(
    @Param('id') id: string,
    @Request() req,
    @Query() query,
    @Res() response,
  ) {
    const userId = req.user.id;
    const expenses = await this.expensesService.findLastMonthsFromOnlyCategory(
      userId,
      +id,
      query,
    );
    response.status(HttpStatus.OK).json(expenses);
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
