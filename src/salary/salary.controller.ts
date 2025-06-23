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
} from '@nestjs/swagger';


@ApiTags('Salary')
@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER])
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
  @Roles([UserRole.OWNER])
  @Get()
  @ApiOperation({ summary: 'Get all salary records' })
  findAll() {
    return this.salaryService.findAll();
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER])
  @Get(':id')
  @ApiOperation({ summary: 'Get one salary by ID' })
  @ApiParam({ name: 'id', description: 'Salary ID' })
  findOne(@Param('id') id: string) {
    return this.salaryService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER])
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
  @Roles([UserRole.OWNER])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete salary by ID' })
  @ApiParam({ name: 'id', description: 'Salary ID' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.salaryService.remove(id, userId);
  }
}
