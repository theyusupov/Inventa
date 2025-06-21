import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
// import { JwtRoleGuard } from 'src/shared/guards/role.guard';
// import { Roles } from 'src/shared/guards/role.decorator';
// import { UserRole } from 'generated/prisma';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProductDto, @Request() req) {
    let userId = req.user.id
    return this.productService.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req) {
    let userId = req.user.id
    return this.productService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string,  @Request() req) {
    let userId = req.user.id
    return this.productService.remove(id, userId);
  }
}
