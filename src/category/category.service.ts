import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

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

    return { message: 'Category created successfully' };
  }

  async findAll() {
    return await this.prisma.category.findMany();
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

    return { message: 'Category updated successfully' };
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
