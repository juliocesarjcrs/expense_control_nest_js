import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Request,
  Res,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category-dto';

@Controller('categories')
export class CategoriesController {
  constructor(private categoryService: CategoriesService) {}
  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Res() response,
    @Request() req,
  ) {
    createCategoryDto = { ...createCategoryDto, userId: req.user.id };
    this.categoryService
      .createCategory(createCategoryDto)
      .then((category) => {
        response.status(HttpStatus.CREATED).json(category);
      })
      .catch((error) => {
        response.status(HttpStatus.FORBIDDEN).json({
          message: error.message || 'Error en la creaciónde una categoria',
        });
      });
  }
  @Get()
  getAll(@Res() response) {
    this.categoryService
      .findAll()
      .then((listCategories) => {
        response.status(HttpStatus.OK).json(listCategories);
      })
      .catch(() => {
        response
          .status(HttpStatus.FORBIDDEN)
          .json({ message: 'Error en listar categorias' });
      });
  }
}
