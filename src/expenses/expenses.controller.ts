import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    createExpenseDto = { ...createExpenseDto, userId: req.user.id };
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  findAll(@Request() req) {
    const userId = req.user.id;
    return this.expensesService.findAll(userId);
  }
  @Get('subcategory/:id')
  findAllFromSubcategory(@Param('id') id: string,@Request() req) {
    const userId = req.user.id;
    return this.expensesService.findAllFromSubcategory(userId, +id);
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
