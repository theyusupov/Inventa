import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Prisma, Region } from 'generated/prisma';
import * as ExcelJS from 'exceljs';
import e, { Response } from 'express';

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePartnerDto, userId: string) {
    const exists = await this.prisma.partner.findFirst({
      where: { phoneNumbers:{hasSome: dto.phoneNumbers }},
    });
    if (exists) throw new ConflictException('Phone number already in use');

    const partner = await this.prisma.partner.create({
      data: { ...dto, userId },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'partner',
        actionType: 'CREATE',
        recordId: partner.id,
        newValue: partner,
        userId,
        comment: 'Partner created',
      },
    });

    return { message: 'Partner created successfully', data: partner };
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

    const where: Prisma.PartnerWhereInput | undefined = search
      ? {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : undefined;

    const data = await this.prisma.partner.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: Number(limit),
    });

    const total = await this.prisma.partner.count({ where });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: {
        purchases: true,
        contracts: true,
        payments: true,
      },
    });

    if (!partner) throw new NotFoundException('Partner not found');

    return partner ;
  }

  async update(id: string, dto: UpdatePartnerDto, userId: string) {
    const existing = await this.prisma.partner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Partner not found');

    const requestUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!requestUser) throw new NotFoundException('Requesting user not found');

    const isCreator = existing.userId === userId;
    const isOwner = requestUser.role === 'OWNER';

    if (!isCreator && !isOwner) {
      throw new ForbiddenException('You can update only partners which you created or if you are owner');
    }
    if (dto.phoneNumbers && dto.phoneNumbers.some((phone)=>existing.phoneNumbers.includes(phone))) {
      const phoneUsed = await this.prisma.partner.findFirst({
        where: { phoneNumbers: {hasSome:dto.phoneNumbers} },
      });
      if (phoneUsed) throw new ConflictException('Phone number already in use');
    }

    const updated = await this.prisma.partner.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'partner',
        actionType: 'UPDATE',
        recordId: id,
        oldValue: existing,
        newValue: updated,
        userId,
        comment: 'Partner updated',
      },
    });

    return { message: 'Partner updated successfully', data: updated };
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.partner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Partner not found');

    await this.prisma.partner.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'partner',
        actionType: 'DELETE',
        recordId: existing.id,
        oldValue: existing,
        userId,
        comment: 'Partner deleted',
      },
    });

    return { message: 'Partner deleted successfully' };
  }

  async exportToExcel(res: Response) {
      const partners = await this.prisma.partner.findMany({
        include: {
          user: true,
        },
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Partners');

      worksheet.addRow([
        '№',
        'ID',
        'Full Name',
        'Phone Number',
        'Address',
        'Is Active',
        'Balance',
        'Role',
        'Created At',
        'Updated At',
        'User Full Name',
      ]);

      partners.forEach((partner, index) => {
        worksheet.addRow([
          index + 1,
          partner.id,
          partner.fullName,
          partner.phoneNumbers,
          partner.address,
          partner.isActive ? 'Yes' : 'No',
          partner.balance,
          partner.role,
          partner.createdAt?.toISOString().split('T')[0],
          partner.updatedAt?.toISOString().split('T')[0],
          partner.user?.fullName || '—',
        ]);
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=partners.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();
    }
}
