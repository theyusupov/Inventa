import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

async create(createCategoryDto: CreateCategoryDto, userId: string) {
    const category = await this.prisma.category.create({
      data: createCategoryDto,
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

    return { message: 'Category created successfully', category};
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
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, data: Partial<CreateCategoryDto>, userId: string) {
    const oldCategory = await this.findOne(id);

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'category',
        actionType: 'UPDATE',
        recordId: id,
        oldValue: oldCategory,
        newValue: category,
        comment: 'Category updated',
        userId,
      },
    });

    return { message: 'Category updated successfully', category };
  }

  async remove(id: string, userId: string) {
    const oldCategory = await this.findOne(id);

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

    return { message: 'Category deleted successfully' };
  }
}
