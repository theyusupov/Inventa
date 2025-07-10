import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Prisma } from 'generated/prisma';
import * as path from 'path';
import * as fs from 'fs/promises';


@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, userId: string) {
    const category = await this.prisma.category.create({
      data: dto,
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'category',
        actionType: 'CREATE',
        recordId: category.id,
        newValue: category,
        comment: 'Category created',
        userId,
      },
    });

    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  async findAll(params: {
    search?: string;
    sortBy?: keyof Prisma.CategoryOrderByWithRelationInput;
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

    const where: Prisma.CategoryWhereInput = search
      ? {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const orderBy: Prisma.CategoryOrderByWithRelationInput = {
      [sortBy]: order as Prisma.SortOrder,
    };

    const categories = await this.prisma.category.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.category.count({ where });

    return {
      data: categories,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category fetched successfully',
      data: category,
    };
  }

  async update(
    id: string,
    dto: Partial<CreateCategoryDto>,
    userId: string,
  ) {
    const oldCategory = await this.prisma.category.findUnique({ where: { id } });
    if (!oldCategory) {
      throw new NotFoundException('Category not found');
    }

    let updatedImage = oldCategory.image;

    if (dto.image && dto.image !== oldCategory.image) {
      const filePath = path.join(__dirname, '../../images', oldCategory.image);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('Eski rasmni o‘chirishda xatolik:', err.message);
      }
      updatedImage = dto.image;
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        image: updatedImage,
        updatedAt: new Date(),
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'category',
        actionType: 'UPDATE',
        recordId: id,
        oldValue: oldCategory,
        newValue: updatedCategory,
        comment: 'Category updated',
        userId,
      },
    });

    return {
      message: 'Category updated successfully',
      category: updatedCategory,
    };
  }

  async remove(id: string, userId: string) {
    const oldCategory = await this.prisma.category.findUnique({ where: { id } });
    if (!oldCategory) {
      throw new NotFoundException('Category not found');
    }

    if (oldCategory.image) {
        const filePath = path.join(__dirname, '../../images', oldCategory.image);
        try {
          await fs.unlink(filePath);
      } catch {}
      }

    await this.prisma.category.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'category',
        actionType: 'DELETE',
        recordId: id,
        oldValue: oldCategory,
        comment: 'Category deleted',
        userId,
      },
    });

    return {
      message: 'Category deleted successfully',
    };
  }
}
