import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { ProductImageService } from './product-image.service';
import { multerUploadProductImages } from 'src/shared/multer';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Product Image')
@ApiBearerAuth()
@Controller('product-image')
export class ProductImageController {
  constructor(private readonly service: ProductImageService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Post()
  @UseInterceptors(FileInterceptor('image', { storage: multerUploadProductImages }))
  @ApiOperation({ summary: 'Upload a product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload product image',
    schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          example: 'a1b2c3d4-5678-90ef-ghij-klmnopqrstuv',
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['productId', 'image'],
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  create(
    @Body() dto: CreateProductImageDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.service.create(dto, file, userId);
  }

@UseGuards(JwtAuthGuard, JwtRoleGuard)
@Roles([UserRole.STAFF, UserRole.OWNER])
@Get()
@ApiOperation({ summary: 'Get all product images with filters, sorting, and pagination' })
@ApiQuery({ name: 'search', required: false, type: String })
@ApiQuery({ name: 'sortBy', required: false, type: String })
@ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
@ApiResponse({ status: 200, description: 'List of product images' })
findAll(
  @Query('search') search?: string,
  @Query('sortBy') sortBy?: string,
  @Query('order') order: 'asc' | 'desc' = 'asc',
  @Query('page') page?: string,
  @Query('limit') limit?: string,
) {
  return this.service.findAll({
    search,
    sortBy,
    order,
    page: parseInt(page || '1'),
    limit: parseInt(limit || '10'),
  });
}


  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product image by ID' })
  @ApiParam({ name: 'id', type: 'string', example: 'f3a1e8d4-12bc-4a7b-9349-1c122a3cf456' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.service.remove(id, userId);
  }
}
