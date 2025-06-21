import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductActionHistoryService } from './product-action-history.service';
import { CreateProductActionHistoryDto } from './dto/create-product-action-history.dto';
import { UpdateProductActionHistoryDto } from './dto/update-product-action-history.dto';

@Controller('product-action-history')
export class ProductActionHistoryController {
  constructor(private readonly productActionHistoryService: ProductActionHistoryService) {}

  @Post()
  create(@Body() createProductActionHistoryDto: CreateProductActionHistoryDto) {
    return this.productActionHistoryService.create(createProductActionHistoryDto);
  }

  @Get()
  findAll() {
    return this.productActionHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productActionHistoryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductActionHistoryDto: UpdateProductActionHistoryDto) {
    return this.productActionHistoryService.update(+id, updateProductActionHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productActionHistoryService.remove(+id);
  }
}
