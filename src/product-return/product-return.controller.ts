import { Controller, Post, Get, Param, Patch, Delete, Body, Request, UseGuards } from '@nestjs/common';
import { ProductReturnService } from './product-return.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { UpdateProductReturnDto } from './dto/update-product-return.dto';
// import { JwtAuthGuard } from 'src/shared/token.guard';
// import { JwtRoleGuard } from 'src/shared/role.guard';
// import { Roles } from 'src/shared/role.decorator';

@Controller('product-return')
export class ProductReturnController {
  constructor(private readonly productReturnService: ProductReturnService) {}

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])  @Post()
  create(@Body() dto: CreateProductReturnDto, @Request() req) {
    let userId = req.user.id
    return this.productReturnService.create(dto, userId);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Get()
  findAll() {
    return this.productReturnService.findAll();
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productReturnService.findOne(id);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductReturnDto) {
    return this.productReturnService.update(id, dto);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productReturnService.remove(id);
  }
}
