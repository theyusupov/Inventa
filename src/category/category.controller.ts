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
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Get all categories' })
  findAll() {
    return this.categoryService.findAll();
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
