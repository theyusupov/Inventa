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
  Query,
  Res,
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
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';



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

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF, UserRole.OWNER])
  // @Get()
  // @ApiOperation({ summary: 'Get all product returns with filters, sorting, and pagination' })
  // @ApiQuery({ name: 'search', required: false, type: String })
  // @ApiQuery({ name: 'sortBy', required: false, type: String })
  // @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  // @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  // @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  // findAll(
  //   @Query('search') search?: string,
  //   @Query('sortBy') sortBy?: string,
  //   @Query('order') order: 'asc' | 'desc' = 'asc',
  //   @Query('page') page?: string,
  //   @Query('limit') limit?: string,
  // ) {
  //   return this.productReturnService.findAll({
  //     search,
  //     sortBy,
  //     order,
  //     page: parseInt(page || '1'),
  //     limit: parseInt(limit || '10'),
  //   });
  // }


  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF, UserRole.OWNER])
  // @Get(':id')
  // @ApiOperation({ summary: 'Get product return by ID' })
  // @ApiParam({ name: 'id', description: 'Product return ID' })
  // findOne(@Param('id') id: string) {
  //   return this.productReturnService.findOne(id);
  // }



  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF, UserRole.OWNER])
  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete product return by ID' })
  // @ApiParam({ name: 'id', description: 'Product return ID' })
  // remove(@Param('id') id: string, @Request() req) {
  //   const userId = req.user.id;
  //   return this.productReturnService.remove(id, userId);
  // }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF, UserRole.OWNER])
  // @Get('export/excel')
  // @ApiOperation({ summary: 'Export product returns to Excel' })
  // async exportToExcel(@Res() res: Response) {
  //   return this.productReturnService.exportToExcel(res);
  // }
}
