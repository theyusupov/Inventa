import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Body,
  UseGuards,
  Request,
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
} from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Get all purchases' })
  findAll() {
    return this.purchaseService.findAll();
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
}
