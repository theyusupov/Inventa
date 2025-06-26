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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

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
          repaymentPeriod: 3,
          image: '12333497328.png'
        },
      },
      example2: {
        summary: 'Clothes',
        value: {
          name: 'Clothes',
          repaymentPeriod: 2,
          image: '12333497328.png'
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
  @UseInterceptors(FileInterceptor('image')) 
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        repaymentPeriod: { type: 'number' },
        image: {
          type: 'string',
          format: 'binary',
  }, },},})
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
    @Request() req,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    let userId = req.user.id;
    return this.categoryService.update(id, dto, userId, image);
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
