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
  Query,
  Res,
} from '@nestjs/common';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
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


@ApiTags('Salary')
@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER, UserRole.STAFF])
  @Post()
  @ApiOperation({ summary: 'Create new salary' })
  @ApiBody({
    type: CreateSalaryDto,
    examples: {
      example1: {
        summary: 'Create salary example',
        value: {
          amount: 2500000,
          comment: "May oyi uchun oylik",
          userId: "user-uuid-example"
        }
      }
    }
  })
  create(@Body() createSalaryDto: CreateSalaryDto, @Request() req) {
    const userId = req.user.id;
    return this.salaryService.create(createSalaryDto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get()
  @ApiOperation({ summary: 'Get all salaries with filters, sorting, and pagination' })
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
    return this.salaryService.findAll({
      search,
      sortBy,
      order,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '10'),
    });
  }


  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,  UserRole.STAFF])
  @Get(':id')
  @ApiOperation({ summary: 'Get one salary by ID' })
  @ApiParam({ name: 'id', description: 'Salary ID' })
  findOne(@Param('id') id: string) {
    return this.salaryService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,  UserRole.STAFF])
  @Patch(':id')
  @ApiOperation({ summary: 'Update salary by ID' })
  @ApiParam({ name: 'id', description: 'Salary ID' })
  @ApiBody({
    type: UpdateSalaryDto,
    examples: {
      example1: {
        summary: 'Update salary example',
        value: {
          amount: 2700000,
          comment: "Oylik yangilandi"
        }
      }
    }
  })
  update(@Param('id') id: string, @Body() updateSalaryDto: UpdateSalaryDto, @Request() req) {
    const userId = req.user.id;
    return this.salaryService.update(id, updateSalaryDto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,  UserRole.STAFF])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete salary by ID' })
  @ApiParam({ name: 'id', description: 'Salary ID' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.salaryService.remove(id, userId);
  }

  @Get('export/excel')
  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER, UserRole.STAFF])
  @ApiOperation({ summary: 'Export salary list to Excel' })
  async exportToExcel(@Res() res: Response) {
    return this.salaryService.exportToExcel(res);
  }
}
