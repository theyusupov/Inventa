import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from 'generated/prisma';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const category = await this.prisma.category.findUnique({ where: { id: createProductDto.categoryId } });
    if (!category) throw new BadRequestException('Category not found');

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        quantity:0,
        userId,
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'product',
        recordId: product.id,
        actionType: 'CREATE',
        newValue: product,
        userId,
        comment: 'Product created',
      },
    });

    return { message: 'Product created successfully', product };
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

    const where: Prisma.ProductWhereInput = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {};

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.product.count({ where });

    return {
      data: products,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        user: true
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const oldProduct = await this.prisma.product.findUnique({ where: { id } });
    if (!oldProduct) throw new NotFoundException('Product not found');

    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'product',
        recordId: id,
        actionType: 'UPDATE',
        oldValue: oldProduct,
        newValue: product,
        userId,
        comment: 'Product updated',
      },
    });

    return { message: 'Product updated successfully', product };
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');


    await this.prisma.purchase.deleteMany({ where: { productId: id } });
    await this.prisma.contract.deleteMany({ where: { productId: id } });

    if (existing.image) {
      const filePath = path.join(__dirname, '../../images', existing.image);
      try {
        await fs.unlink(filePath);
    } catch {}
    }


    await this.prisma.product.delete({ where: { id } });
    await this.prisma.actionHistory.create({
      data: {
        tableName: 'product',
        recordId: id,
        actionType: 'DELETE',
        oldValue: existing,
        userId,
        comment: 'Product deleted',
      },
    });

    return { message: 'Product deleted successfully' };
  }
}
