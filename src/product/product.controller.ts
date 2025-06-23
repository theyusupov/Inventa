import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole, Units } from 'generated/prisma';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      example1: {
        summary: 'Create Product: Milk',
        value: {
          name: 'Milk 1L',
          sellPrice: 9000,
          buyPrice: 7500,
          quantity: 100,
          unit: 'LITER',
          isActive: true,
          description: 'Fresh cow milk 1 liter',
          comment: 'Imported from farm',
          categoryId: 'category-uuid',
        },
      },
      example2: {
        summary: 'Create Product: Notebook',
        value: {
          name: 'Notebook A5',
          sellPrice: 3000,
          buyPrice: 2500,
          quantity: 200,
          unit: 'PIECE',
          isActive: true,
          description: '60 page student notebook',
          comment: 'Eco paper',
          categoryId: 'category-uuid-2',
        },
      },
    },
  })
  create(@Body() dto: CreateProductDto, @Request() req) {
    const userId = req.user.id;
    return this.productService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  findAll() {
    return this.productService.findAll();
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Patch(':id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiBody({
    type: UpdateProductDto,
    examples: {
      example1: {
        summary: 'Update product price',
        value: {
          sellPrice: 9500,
          quantity: 150,
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req) {
    const userId = req.user.id;
    return this.productService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by ID' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.productService.remove(id, userId);
  }
}
