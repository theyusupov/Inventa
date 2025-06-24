import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReasonService } from './reason.service';
import { CreateReasonDto } from './dto/create-reason.dto';
import { UpdateReasonDto } from './dto/update-reason.dto';
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




@ApiTags('Reason')
@Controller('reason')
export class ReasonController {
  constructor(private readonly reasonService: ReasonService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Post()
  @ApiOperation({ summary: 'Create a new return reason' })
  @ApiBody({
    type: CreateReasonDto,
    examples: {
      example1: {
        summary: 'Create reason example',
        value: {
          reasonText: 'Product was damaged',
        },
      },
    },
  })
  create(@Body() dto: CreateReasonDto, @Request() req) {
    const userId = req.user.id;
    return this.reasonService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get()
  @ApiOperation({ summary: 'Get all reasons with filters, sorting, and pagination' })
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
    @Query('limit') limit?: string,
  ) {
    return this.reasonService.findAll({
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
  @ApiOperation({ summary: 'Get a single reason by ID' })
  @ApiParam({ name: 'id', description: 'Reason ID (UUID)' })
  findOne(@Param('id') id: string) {
    return this.reasonService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Patch(':id')
  @ApiOperation({ summary: 'Update a reason by ID' })
  @ApiParam({ name: 'id', description: 'Reason ID (UUID)' })
  @ApiBody({
    type: UpdateReasonDto,
    examples: {
      example1: {
        summary: 'Update reason example',
        value: {
          reasonText: 'Incorrect item delivered',
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateReasonDto, @Request() req) {
    const userId = req.user.id;
    return this.reasonService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reason by ID' })
  @ApiParam({ name: 'id', description: 'Reason ID (UUID)' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.reasonService.remove(id, userId);
  }
}
