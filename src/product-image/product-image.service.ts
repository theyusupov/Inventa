import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';

@Injectable()
export class ProductImageService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductImageDto, file: Express.Multer.File) {
    if (!file) throw new NotFoundException('Image file is required');

    await this.prisma.productImage.create({
      data: {
        productId: dto.productId,
        image: file.filename,
      },
    });

    return { message: 'Image uploaded successfully'};
  }

  async findAll() {
    return this.prisma.productImage.findMany();
  }

  async remove(id: string) {
    await this.prisma.productImage.delete({ where: { id } });
    return { message: 'Image deleted successfully' };
  }
}
