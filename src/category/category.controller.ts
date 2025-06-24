import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Post()
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiBody({
    type: CreateCategoryDto,
    description: 'Create a new category',
    examples: {
      example1: {
        summary: 'Electronics',
        value: {
          name: 'Electronics',
        },
      },
      example2: {
        summary: 'Electronics',
        value: {
          name: 'Electronics',
        },
      },
    },
  })
  create(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    let userId = req.user.id;
    return this.categoryService.create(createCategoryDto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get()
  @ApiOperation({ summary: 'Get all categories with filters, sorting, and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAll(@Query('search') search?: string,
          @Query('sortBy') sortBy?: string,
          @Query('order') order: 'asc' | 'desc' = 'asc',
          @Query('page') page = 1,
          @Query('limit') limit = 10) {
    return this.categoryService.findAll({ search, order, page:parseInt(page.toString(), 10), limit:parseInt(limit.toString(), 10) });
  }



  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Patch(':id')
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiBody({
    type: CreateCategoryDto,
    description: 'Update category',
    examples: {
      example1: {
        summary: 'Change name',
        value: {
          name: 'Electronics',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
    @Request() req,
  ) {
    let userId = req.user.id;
    return this.categoryService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete category by ID' })
  remove(@Param('id') id: string, @Request() req) {
    let userId = req.user.id;
    return this.categoryService.remove(id, userId);
  }
}
