import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  Res,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category-dto';
import { UpdateCategoryDto } from './dto/updated-category.dto';

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
  getAll(@Res() response, @Request() req) {
    const userId = req.user.id;
    this.categoryService
      .findAll(userId)
      .then((listCategories) => {
        response.status(HttpStatus.OK).json(listCategories);
      })
      .catch(() => {
        response
          .status(HttpStatus.FORBIDDEN)
          .json({ message: 'Error en listar categorias' });
      });
  }
  @Get('subcategories')
  findAllWithSubategories(@Res() response, @Request() req) {
    const userId = req.user.id;
    this.categoryService
      .findAllWithSubcategories(userId)
      .then((listCategories) => {
        response.status(HttpStatus.OK).json(listCategories);
      })
      .catch(() => {
        response
          .status(HttpStatus.FORBIDDEN)
          .json({ message: 'Error en listar categorias con subcategorias' });
      });
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
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
  async remove(@Param('id') id: string, @Res() response) {
    try {
      const data = await this.categoryService.remove(+id);
      response.status(HttpStatus.OK).json(data);
    } catch (error) {
      const message = error.message
        ? error.message
        : 'Error en eliminar subcategorias';
      response.status(HttpStatus.FORBIDDEN).json({ message: message });
    }
  }
}
