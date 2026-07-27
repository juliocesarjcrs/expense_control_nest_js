import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category-dto';
import { UpdateCategoryDto } from './dto/updated-category.dto';
import { Response, Request as ExpressRequest } from 'express';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { CategoryQueryParams } from './interfaces/category-query-params.interface';
import { getErrorMessage } from 'src/common/utils/error.util';

@Controller('categories')
export class CategoriesController {
  constructor(private categoryService: CategoriesService) {}

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoryService.createCategory({
      ...createCategoryDto,
      userId: req.user.id,
    });
  }

  @Get()
  async getAll(
    @Res() response: Response,
    @Request() req: AuthenticatedRequest,
    @Query() query: CategoryQueryParams,
  ) {
    const userId = req.user.id;
    const listCategories = await this.categoryService.findAll(userId, query);
    response.status(HttpStatus.OK).json(listCategories);
  }

  @Get('subcategories')
  findAllWithSubcategories(@Request() req: AuthenticatedRequest) {
    return this.categoryService.findAllWithSubcategories(req.user.id);
  }

  @Get('expenses/month')
  findAllExpensesByMonth(
    @Request() req: AuthenticatedRequest,
    @Query() query: CategoryQueryParams,
  ) {
    return this.categoryService.findAllExpensesByMonth(req.user.id, query);
  }
  @Get('subcategories/expenses/month')
  findAllSubcategoriesExpensesByMonth(
    @Res() response: Response,
    @Request() req: AuthenticatedRequest,
    @Query() query: CategoryQueryParams,
  ) {
    const userId = req.user.id;
    this.categoryService
      .findAllSubcategoriesExpensesByMonth(userId, query)
      .then((listCategories) => {
        response.status(HttpStatus.OK).json(listCategories);
      })
      .catch(() => {
        response.status(HttpStatus.FORBIDDEN).json({
          message: 'Error en listar categorias con subcategorias y gastos',
        });
      });
  }

  @Get('incomes')
  findAllTypeIncome(
    @Request() req: AuthenticatedRequest,
    @Query() query: CategoryQueryParams,
  ) {
    return this.categoryService.findAllTypeIncome(req.user.id, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.categoryService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
