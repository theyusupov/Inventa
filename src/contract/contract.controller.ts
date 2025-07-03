import { Controller, Post, Get, Param, Delete, Body, UseGuards, Request, Patch, Query, Res } from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';


@ApiTags('Contract')
@Controller('contract')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @UseGuards(JwtAuthGuard)
  @Roles([UserRole.STAFF])
  @Post()
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiBody({
    type: CreateContractDto,
    examples: {
      example1: {
        summary: 'Basic Contract Creation',
        value: {
          quantity: 4,
          sellPrice:1000,
          repaymentPeriod: 6,
          productId: 'product-uuid',
          partnerId: 'partner-uuid'        
        },
      },
    },
  })
  create(@Body() dto: CreateContractDto, @Request() req) {
    const userId = req.user.id;
    return this.contractService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get()
  @ApiOperation({ summary: 'Get all contracts with filters, sorting, and pagination' })
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
    return this.contractService.findAll({search,sortBy,order,page: parseInt(page || '1'),limit: parseInt(limit || '10'),});
  }


  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF])
  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }


  @UseGuards(JwtAuthGuard)
  @Roles([UserRole.STAFF])
  @Patch(':id')
  @ApiOperation({ summary: 'Update contract and recalculate totals' })
  @ApiBody({
    type: CreateContractDto, 
    examples: {
      updatePriceOnly: {
        summary: 'Update only sell price',
        value: {
          sellPrice: 600       
         },
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: Partial<CreateContractDto>, @Request() req) {
    const userId = req.user.id;
    return this.contractService.update(id, dto, userId);
  }



  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete contract by ID' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.contractService.remove(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('export/excel')
  @ApiOperation({ summary: 'Export contracts to Excel' })
  @ApiResponse({ status: 200, description: 'Excel fayl yuklab olinadi' })
  exportExcel(@Res() res: Response) {
    return this.contractService.exportToExcel(res);
  }

}
 