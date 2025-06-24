import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class DebtService {
  constructor(private readonly prisma: PrismaService) {}

  // async create(dto: CreateDebtDto, userId: string) {
  //   const contract = await this.prisma.contract.findUnique({ where: { id: dto.contractId } });
  //   if (!contract) {
  //     throw new BadRequestException('Contract not found');
  //   }

  //   const debt = await this.prisma.debt.create({ data: dto });

  //   await this.prisma.actionHistory.create({
  //     data: {
  //       tableName: 'debt',
  //       actionType: 'CREATE',
  //       recordId: debt.id,
  //       newValue: debt,
  //       comment: 'Debt created',
  //       userId,
  //     },
  //   });

  //   return { message: 'Debt created successfully', debt };
  // }

    
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

    const debts = await this.prisma.debt.findMany({
      where,
      orderBy: {
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        contract: {
          include: {
            partner: true,
          },
        },
        payments: true,
      },
    });

    const total = await this.prisma.debt.count({ where });

    return {
      data: debts,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }


  async findOne(id: string) {
    let debt = await this.prisma.debt.findUnique({
      where: { id },
      include: {contract: true, payments: true },
    });
    if(!debt)throw new BadRequestException('Debt not found');
     return {message:"Debt created sucessfully!", debt}
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.debt.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Debt not found');

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
  }

  // async update(id: string, dto: UpdateDebtDto, userId: string) {
  //   const existing = await this.prisma.debt.findUnique({ where: { id } });
  //   if (!existing) throw new BadRequestException('Debt not found');

  //   const updated = await this.prisma.debt.update({
  //     where: { id },
  //     data: {
  //       ...dto,
  //       updatedAt: new Date(),
  //     },
  //   });

  //   await this.prisma.actionHistory.create({
  //     data: {
  //       tableName: 'debt',
  //       actionType: 'UPDATE',
  //       recordId: updated.id,
  //       oldValue: existing,
  //       newValue: updated,
  //       comment: 'Debt updated',
  //       userId,
  //     },
  //   });

  //   return { message: 'Debt updated successfully', updated};
  // }
}
