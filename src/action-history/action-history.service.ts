import { Injectable } from '@nestjs/common';
import { CreateActionHistoryDto } from './dto/create-action-history.dto';
import { UpdateActionHistoryDto } from './dto/update-action-history.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma';
import { ActionType } from 'generated/prisma';

@Injectable()
export class ActionHistoryService {
  constructor(readonly prisma:PrismaService){}
  
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
      order = 'desc',
      page = 1,
      limit = 10,
    } = params;

  const where: Prisma.ActionHistoryWhereInput = search
    ? {
        OR: [
          {
            tableName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            comment: {
              contains: search,
              mode: 'insensitive',
            },
          },
          ...(Object.values(ActionType).includes(search.toUpperCase() as ActionType)
            ? [
                {
                  actionType: {
                    equals: search.toUpperCase() as ActionType,
                  },
                },
              ]
            : []),
        ],
      }
    : {};


    const data = await this.prisma.actionHistory.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.actionHistory.count({ where });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async remove(id: string) {
    await this.prisma.actionHistory.delete({where:{id}})
    return {message:"History deleted successfully!"};
  }
}
