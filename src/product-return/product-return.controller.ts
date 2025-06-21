import { Controller, Post, Get, Param, Patch, Delete, Body, Request, UseGuards } from '@nestjs/common';
import { ProductReturnService } from './product-return.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { UpdateProductReturnDto } from './dto/update-product-return.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';

@Controller('product-return')
export class ProductReturnController {
  constructor(private readonly productReturnService: ProductReturnService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProductReturnDto, @Request() req) {
    let userId = req.user.id
    return this.productReturnService.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.productReturnService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productReturnService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductReturnDto) {
    return this.productReturnService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productReturnService.remove(id);
  }
}
