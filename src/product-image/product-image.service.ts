import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class ProductImageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductImageDto, file: Express.Multer.File, userId: string) {
    if (!file?.filename) {
      throw new BadRequestException('Image file is required');
    }

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

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

    return { message: 'Image uploaded successfully', newImage };
  }

  async findAll(params: {
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      sortBy = 'createdAt',
      order = 'asc',
      page = 1,
      limit = 10,
    } = params;

    const where: Prisma.ProductImageWhereInput = search
      ? {
          product: {
            is: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        }
      : {};

    const productImages = await this.prisma.productImage.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.productImage.count({ where });

    return {
      data: productImages,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.productImage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Image not found');
    }

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
