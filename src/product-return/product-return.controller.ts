import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductReturnService } from './product-return.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { UpdateProductReturnDto } from './dto/update-product-return.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';



@ApiTags('Product Return')
@Controller('product-return')
export class ProductReturnController {
  constructor(private readonly productReturnService: ProductReturnService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Post()
  @ApiOperation({ summary: 'Create a product return' })
  @ApiBody({
    type: CreateProductReturnDto,
    examples: {
      example1: {
        summary: 'Return new product',
        value: {
          isNew: true,
          contractId: 'contract-uuid-example',
          reasonId: 'reason-uuid-example',
        },
      },
      example2: {
        summary: 'Return used product (will be rejected)',
        value: {
          isNew: false,
          contractId: 'contract-uuid-example',
          reasonId: 'reason-uuid-example',
        },
      },
    },
  })
  create(@Body() dto: CreateProductReturnDto, @Request() req) {
    const userId = req.user.id;
    return this.productReturnService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get()
  @ApiOperation({ summary: 'Get all product returns' })
  findAll() {
    return this.productReturnService.findAll();
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get(':id')
  @ApiOperation({ summary: 'Get product return by ID' })
  @ApiParam({ name: 'id', description: 'Product return ID' })
  findOne(@Param('id') id: string) {
    return this.productReturnService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product return' })
  @ApiParam({ name: 'id', description: 'Product return ID' })
  @ApiBody({
    type: UpdateProductReturnDto,
    examples: {
      example1: {
        summary: 'Update product return reason',
        value: {
          isNew: true,
          contractId: 'updated-contract-id',
          reasonId: 'updated-reason-id',
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateProductReturnDto, @Request() req) {
    const userId = req.user.id;
    return this.productReturnService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product return by ID' })
  @ApiParam({ name: 'id', description: 'Product return ID' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.productReturnService.remove(id, userId);
  }
}
