import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';

@Injectable()
export class ProductImageService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductImageDto, file: Express.Multer.File, userId: string) {
    if (!file) throw new NotFoundException('Image file is required');

    const newImage = await this.prisma.productImage.create({
      data: {
        productId: dto.productId,
        image: file.filename,
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'productImage',
        recordId: newImage.id,
        actionType: 'CREATE',
        newValue: newImage,
        userId,
        comment: 'Product image uploaded',
      },
    });

    return { message: 'Image uploaded successfully' };
  }

  async findAll() {
    return this.prisma.productImage.findMany();
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.productImage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Image not found');

    await this.prisma.productImage.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'productImage',
        recordId: id,
        actionType: 'DELETE',
        oldValue: existing,
        userId,
        comment: 'Product image deleted',
      },
    });

    return { message: 'Image deleted successfully' };
  }
}
