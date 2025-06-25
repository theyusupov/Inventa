import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { DebtService } from './debt.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Debt')
@Controller('debt')
export class DebtController {
  constructor(private readonly debtService: DebtService) {}

@UseGuards(JwtAuthGuard, JwtRoleGuard)
@Roles([UserRole.STAFF, UserRole.OWNER])
@Get()
@ApiOperation({ summary: 'Get all debts with filters, sorting, and pagination' })
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
  return this.debtService.findAll({
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
  @ApiOperation({ summary: 'Get a single debt by ID' })
  @ApiParam({ name: 'id', description: 'Debt ID' })
  findOne(@Param('id') id: string) {
    return this.debtService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a debt by ID' })
  @ApiParam({ name: 'id', description: 'Debt ID' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.debtService.remove(id, userId);
  }

}
