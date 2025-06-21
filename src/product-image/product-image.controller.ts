import {Controller, Post, Get, Delete, Param, UploadedFile, UseInterceptors, Body} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { ProductImageService } from './product-image.service';
import { multerUploadProductImages } from 'src/shared/multer';
// import { JwtAuthGuard } from 'src/shared/token.guard';
// import { JwtRoleGuard } from 'src/shared/role.guard';
// import { Roles } from 'src/shared/role.decorator';

@Controller('product-image')
export class ProductImageController {
  constructor(private readonly service: ProductImageService) {}

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Post()
  @UseInterceptors(FileInterceptor('image',{storage:multerUploadProductImages}))
  create(
    @Body() dto: CreateProductImageDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.service.create(dto, file);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
