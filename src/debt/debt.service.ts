import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class DebtService {
  constructor(private readonly prisma: PrismaService) {}

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

    const where: Prisma.DebtWhereInput | undefined = search
      ? {
          contract: {
            is: {
              partner: {
                is: {
                  fullName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        }
      : undefined;

    try {
      const debts = await this.prisma.debt.findMany({
        where,
        orderBy: {
          [sortBy]: order,
        },
        skip: (page - 1) * limit,
        take: Number(limit),
      });

      const total = await this.prisma.debt.count({ where });

      return {
        data: debts,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch debts');
    }
  }

  async findOne(id: string) {
    const debt = await this.prisma.debt.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            partner: true,
            product: true,
            user: true,
          },
        },
        payments: true,
      },
    });

    if (!debt) {
      throw new NotFoundException('Debt not found');
    }

    return  debt
    
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.debt.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Debt not found');
    }

    try {
      await this.prisma.debt.delete({ where: { id } });

      await this.prisma.actionHistory.create({
        data: {
          tableName: 'debt',
          actionType: 'DELETE',
          recordId: id,
          oldValue: existing,
          comment: 'Debt deleted',
          userId,
        },
      });

      return { message: 'Debt deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete debt');
    }
  }
}
