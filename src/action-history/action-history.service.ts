import { Injectable } from '@nestjs/common';
import { CreateActionHistoryDto } from './dto/create-action-history.dto';
import { UpdateActionHistoryDto } from './dto/update-action-history.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma';
import { ActionType } from 'generated/prisma';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

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

  async exportToExcel(res: Response) {
      const history = await this.prisma.actionHistory.findMany({
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Action History');

      worksheet.addRow([
        '№',
        'Table Name',
        'Record ID',
        'Action Type',
        'User',
        'Comment',
        'Old Value',
        'New Value',
        'Created At',
      ]);

      history.forEach((item, index) => {
        worksheet.addRow([
          index + 1,
          item.tableName,
          item.recordId,
          item.actionType,
          item.user?.fullName || '—',
          item.comment || '',
          JSON.stringify(item.oldValue, null, 2),
          JSON.stringify(item.newValue, null, 2),
          item.createdAt.toISOString().split('T')[0],
        ]);
      });

      worksheet.columns.forEach(column => {
        column.width = 25;
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=action-history.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    }
}
