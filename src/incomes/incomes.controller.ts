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
} from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import {
  FindLastQueryParams,
  NumMonthsQueryParams,
} from './interfaces/income-query-params.interface';
import { IncomeSearchOptions } from './interfaces/income-search-options.interface';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  create(
    @Body() createIncomeDto: CreateIncomeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.incomesService.create({
      ...createIncomeDto,
      userId: req.user.id,
    });
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: NumMonthsQueryParams,
  ) {
    return this.incomesService.findAll(req.user.id, query);
  }

  @Get('last')
  findLast(
    @Request() req: AuthenticatedRequest,
    @Query() query: FindLastQueryParams,
  ) {
    return this.incomesService.findLast(req.user.id, query);
  }

  @Get('category/:id')
  findLastMonthsFromOnlyCategory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Query() query: NumMonthsQueryParams,
  ) {
    return this.incomesService.findLastMonthsFromOnlyCategory(
      req.user.id,
      +id,
      query,
    );
  }

  @Get('by-category/:categoryId')
  findIncomesByCategory(
    @Param('categoryId') categoryId: string,
    @Request() req: AuthenticatedRequest,
    @Query() query: IncomeSearchOptions,
  ) {
    return this.incomesService.findIncomesByCategoryId(
      req.user.id,
      +categoryId,
      query,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incomesService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateIncomeDto: UpdateIncomeDto) {
    return this.incomesService.update(+id, updateIncomeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incomesService.remove(+id);
  }
}
