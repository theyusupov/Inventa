import { Controller, Post, Get, Param, Delete, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';


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
          quantity: 5,
          sellPrice: 250000,
          repaymentPeriod: 6,
          productId: 'product-uuid',
          partnerId: 'partner-uuid',
          status: 'ONGOING' 
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
  @ApiOperation({ summary: 'Get all contracts' })
  findAll() {
    return this.contractService.findAll();
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF])
  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Patch(':id')
  @ApiOperation({ summary: 'Update contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiBody({
    type: UpdateContractDto,
    examples: {
      example1: {
        summary: 'Update Contract',
        value: {
          quantity: 6,
          repaymentPeriod: 8,
          sellPrice: 270000,
          status: 'CANCELLED'
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateContractDto, @Request() req) {
    const userId = req.user.id;
    return this.contractService.update(id, dto, userId);
  }
}
