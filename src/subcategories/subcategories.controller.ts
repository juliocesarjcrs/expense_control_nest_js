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
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoryQueryParams } from './interfaces/subcategory-query-params.interface';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  create(
    @Body() createSubcategoryDto: CreateSubcategoryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.subcategoriesService.create({
      ...createSubcategoryDto,
      userId: req.user.id,
    });
  }

  @Get()
  findAll() {
    return this.subcategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subcategoriesService.findOne(+id);
  }

  @Get('category/:id')
  findAllByCategory(
    @Param('id') id: string,
    @Query() query: SubcategoryQueryParams,
  ) {
    return this.subcategoriesService.findAllByCategory(+id, query);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
  ) {
    return this.subcategoriesService.update(+id, updateSubcategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subcategoriesService.remove(+id);
  }
}
