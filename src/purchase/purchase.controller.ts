import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Body,
  UseGuards,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
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

@ApiTags('Purchase')
@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Post()
  @ApiOperation({ summary: 'Create a new purchase' })
  @ApiBody({
    type: CreatePurchaseDto,
    examples: {
      example1: {
        summary: 'Basic purchase example',
        value: {
          buyPrice: 300,
          quantity:20,
          comment: 'Purchased 10 units of product A',
          partnerId: 'partner-uuid',
          productId: 'product-uuid',
        },
      },
    },
  })
  create(@Body() dto: CreatePurchaseDto, @Request() req) {
    const userId = req.user.id;
    return this.purchaseService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get()
  @ApiOperation({ summary: 'Get all purchases with filters, sorting, and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAll(
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.purchaseService.findAll({
      search,
      sortBy,
      order,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '10'),
    });
  }


  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get(':id')
  @ApiOperation({ summary: 'Get one purchase by ID' })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  findOne(@Param('id') id: string) {
    return this.purchaseService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a purchase by ID' })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.purchaseService.remove(id, userId);
  }


  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get('export/excel')
  @ApiOperation({ summary: 'Export purchases to Excel file' })
  exportToExcel(@Res() res: Response) {
    return this.purchaseService.exportToExcel(res);
  }
}
