import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductActionHistoryService } from './product-action-history.service';


@Controller('product-action-history')
export class ProductActionHistoryController {
  constructor(private readonly productActionHistoryService: ProductActionHistoryService) {}

  @Get()
  findAll() {
    return this.productActionHistoryService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productActionHistoryService.remove(id);
  }
}
