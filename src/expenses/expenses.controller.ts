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
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateManyExpensesDto } from './dto/create-many-expenses.dto';
import { ExpenseSearchOptionsDto } from './dto/expense-search-options.dto';
import { ComparePeriodsDto } from './dto/compare-periods.dto';
import { AverageBySubcategoriesDto } from './dto/average-by-subcategories.dto';
import {
  NumMonthsQueryParams,
  DateQueryParams,
  FindLastQueryParams,
} from './interfaces/expense-query-params.interface';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.expensesService.create({
      ...createExpenseDto,
      userId: req.user.id,
    });
  }

  @Post('bulk')
  createMany(
    @Body() createManyExpensesDto: CreateManyExpensesDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const expensesWithUser = createManyExpensesDto.expenses.map((expense) => ({
      ...expense,
      userId: req.user.id,
    }));
    return this.expensesService.createMany(expensesWithUser);
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: NumMonthsQueryParams,
  ) {
    return this.expensesService.findAll(req.user.id, query);
  }

  @Get('last/download')
  findLastDownload(
    @Request() req: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    const userId = req.user.id;
    return this.expensesService.findAllDownload(userId, response);
  }

  @Get('subcategory/:id')
  findAllFromSubcategory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Query() query: DateQueryParams,
  ) {
    return this.expensesService.findAllFromSubcategory(req.user.id, +id, query);
  }

  @Get('by-subcategories')
  findExpensesBySubcategories(
    @Request() req: AuthenticatedRequest,
    @Query() query: ExpenseSearchOptionsDto,
  ) {
    if (!query.subcategoriesId || query.subcategoriesId.length === 0) {
      throw new BadRequestException('Las subcategories son obligatorias');
    }
    return this.expensesService.findExpensesBySubcategories(
      req.user.id,
      query.subcategoriesId,
      query,
    );
  }

  @Get('subcategory/:id/last')
  findLastMonthsFromSubcategory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Query() query: NumMonthsQueryParams,
  ) {
    return this.expensesService.findLastMonthsFromSubcategory(
      req.user.id,
      +id,
      query,
    );
  }

  @Get('category/:id')
  findLastMonthsFromOnlyCategory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Query() query: NumMonthsQueryParams,
  ) {
    return this.expensesService.findLastMonthsFromOnlyCategory(
      req.user.id,
      +id,
      query,
    );
  }

  @Get('last')
  findLast(
    @Request() req: AuthenticatedRequest,
    @Query() query: FindLastQueryParams,
  ) {
    return this.expensesService.findLast(req.user.id, query);
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

  @Post('analysis/compare-periods')
  comparePeriods(
    @Request() req: AuthenticatedRequest,
    @Body() body: ComparePeriodsDto,
  ) {
    const { categories, periodA, periodB } = body;
    return this.expensesService.comparePeriods(
      req.user.id,
      categories,
      periodA,
      periodB,
    );
  }

  @Get('average/by-subcategories')
  getAverageBySubcategories(
    @Request() req: AuthenticatedRequest,
    @Query() query: AverageBySubcategoriesDto,
  ) {
    const { year, referenceYear } = query;
    const yearToCalculate = referenceYear || year - 1;
    return this.expensesService.getAverageBySubcategories(
      req.user.id,
      yearToCalculate,
      query.nature,
    );
  }
}
