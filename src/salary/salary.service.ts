import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class SalaryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSalaryDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const salary = await this.prisma.salary.create({ data: dto });

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { balance: user.balance + dto.amount },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'salary',
        recordId: salary.id,
        actionType: 'CREATE',
        userId,
        newValue: salary,
        comment: 'Salary created',
      },
    });

    return { message: 'Salary created successfully', salary };
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

    const where: Prisma.SalaryWhereInput = search
      ? {
          user: {
            is: {
              fullName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        }
      : {};

    const salaries = await this.prisma.salary.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.salary.count({ where });

    return {
      data: salaries,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const salary = await this.prisma.salary.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!salary) throw new NotFoundException('Salary not found');

    return salary;
  }

  async update(id: string, dto: UpdateSalaryDto, userId: string) {
    const oldSalary = await this.prisma.salary.findUnique({ where: { id } });
    if (!oldSalary) throw new NotFoundException('Salary not found');

    const user = await this.prisma.user.findUnique({ where: { id: oldSalary.userId! } });
    if (!user) throw new NotFoundException('User not found');

    const oldAmount = oldSalary.amount;
    const newAmount = dto.amount ?? oldAmount;
    const amountDiff = newAmount - oldAmount;

    const updatedSalary = await this.prisma.salary.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    await this.prisma.user.update({
      where: { id: oldSalary.userId! },
      data: {
        balance: user.balance + amountDiff,
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'salary',
        recordId: updatedSalary.id,
        actionType: 'UPDATE',
        userId,
        oldValue: oldSalary,
        newValue: updatedSalary,
        comment: 'Salary updated and balance adjusted',
      },
    });

    return { message: 'Salary updated successfully', updated: updatedSalary };
  }

  async remove(id: string, userId: string) {
    const salary = await this.prisma.salary.findUnique({ where: { id } });
    if (!salary) throw new NotFoundException('Salary not found');

    const user = await this.prisma.user.findUnique({ where: { id: salary.userId !} });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.salary.delete({ where: { id } });

    await this.prisma.user.update({
      where: { id: salary.userId! },
      data: { balance: user.balance - salary.amount },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'salary',
        recordId: id,
        actionType: 'DELETE',
        userId,
        oldValue: salary,
        comment: 'Salary deleted and balance updated',
      },
    });

    return { message: 'Salary deleted successfully' };
  }
}
