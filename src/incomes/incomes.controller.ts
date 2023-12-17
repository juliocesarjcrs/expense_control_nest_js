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
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeSearchOptions } from './  income-search-options.interface';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  create(@Body() createIncomeDto: CreateIncomeDto, @Request() req) {
    createIncomeDto = { ...createIncomeDto, userId: req.user.id };
    return this.incomesService.create(createIncomeDto);
  }

  @Get()
  findAll(@Request() req, @Query() query) {
    const userId = req.user.id;
    return this.incomesService.findAll(userId, query);
  }

  @Get('last')
  async findLast(@Request() req, @Query() query, @Res() response) {
    const userId = req.user.id;
    const incomes = await this.incomesService.findLast(userId, query);
    response.status(HttpStatus.OK).json(incomes);
  }

  @Get('category/:id')
  async findLastMonthsFromOnlyCategory(
    @Param('id') id: string,
    @Request() req,
    @Query() query,
    @Res() response,
  ) {
    const userId = req.user.id;
    const incomes = await this.incomesService.findLastMonthsFromOnlyCategory(
      userId,
      +id,
      query,
    );
    response.status(HttpStatus.OK).json(incomes);
  }
  @Get('by-category/:categoryId')
  async findIncomesByCategory(
    @Param('categoryId') categoryId: number,
    @Request() req,
    @Query() query: IncomeSearchOptions,
    @Res() response,
  ) {
    const userId = req.user.id;
    const incomes = await this.incomesService.findIncomesByCategoryId(
      userId,
      categoryId,
      query,
    );
    response.status(HttpStatus.OK).json(incomes);
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
