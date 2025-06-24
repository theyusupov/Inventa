import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReasonDto } from './dto/create-reason.dto';
import { UpdateReasonDto } from './dto/update-reason.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class ReasonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReasonDto, userId: string) {
    const reason = await this.prisma.reason.create({
      data: dto,
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'reason',
        recordId: reason.id,
        actionType: 'CREATE',
        userId,
        newValue: reason,
        comment: 'Reason created',
      },
    });

    return { message: 'Reason created successfully', reason };
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

    const where: Prisma.ReasonWhereInput | undefined = search
      ? {
          reasonText: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : undefined;

    const reasons = await this.prisma.reason.findMany({
      where,
      orderBy: {
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: Number(limit),
    });

    const total = await this.prisma.reason.count({ where });

    return {
      data: reasons,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    let reason = await this.prisma.reason.findUnique({
      where: { id },
    });
    if (!reason) throw new NotFoundException('Reason not found');
    return reason
  }

  async update(id: string, dto: UpdateReasonDto, userId: string) {
    const reason = await this.prisma.reason.findUnique({ where: { id } });
    if (!reason) throw new BadRequestException('Reason not found');

    const updated = await this.prisma.reason.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'reason',
        recordId: updated.id,
        actionType: 'UPDATE',
        userId,
        oldValue: reason,
        newValue: updated,
        comment: 'Reason updated',
      },
    });

    return { message: 'Reason updated successfully', updated };
  }

  async remove(id: string, userId: string) {
    const oldReason = await this.prisma.reason.findUnique({ where: { id } });
    if (!oldReason) throw new BadRequestException('Reason not found');

    await this.prisma.reason.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'reason',
        recordId: id,
        actionType: 'DELETE',
        userId,
        oldValue: oldReason,
        comment: 'Reason deleted',
      },
    });

    return { message: 'Reason deleted successfully' };
  }
}
