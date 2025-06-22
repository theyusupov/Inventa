import { Controller, Post, Get, Param, Patch, Delete, Body, Request, UseGuards } from '@nestjs/common';
import { ProductReturnService } from './product-return.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { UpdateProductReturnDto } from './dto/update-product-return.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';

@Controller('product-return')
export class ProductReturnController {
  constructor(private readonly productReturnService: ProductReturnService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Post()
  create(@Body() dto: CreateProductReturnDto, @Request() req) {
    let userId = req.user.id;
    return this.productReturnService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get()
  findAll() {
    return this.productReturnService.findAll();
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productReturnService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductReturnDto, @Request() req) {
    const userId = req.user.id;
    return this.productReturnService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.productReturnService.remove(id, userId);
  }
}
