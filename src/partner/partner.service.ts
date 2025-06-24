import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPartnerDto: CreatePartnerDto, userId: string) {
    const partner = await this.prisma.partner.create({
      data: { ...createPartnerDto, userId },
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

    return { message: 'Partner created successfully', partner};
  }

  async findAll() {
    return await this.prisma.partner.findMany();
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) {
      throw new NotFoundException('Partner not found');
    }
    return partner;
  }

  async update(id: string, updatePartnerDto: UpdatePartnerDto, userId: string) {
    const old = await this.prisma.partner.findUnique({ where: { id } });
    if (!old) throw new BadRequestException('Partner not found');

    const partner = await this.prisma.partner.update({
      where: { id },
      data: { ...updatePartnerDto, updatedAt: new Date() },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'partner',
        actionType: 'UPDATE',
        recordId: partner.id,
        oldValue: old,
        newValue: partner,
        userId,
        comment: 'Partner updated',
      },
    });

    return { message: 'Partner updated successfully', partner};
  }

  async remove(id: string, userId: string) {
    const old = await this.prisma.partner.findUnique({ where: { id } });
    if (!old) throw new BadRequestException('Partner not found');

    await this.prisma.partner.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'partner',
        actionType: 'DELETE',
        recordId: old.id,
        oldValue: old,
        userId,
        comment: 'Partner deleted',
      },
    });

    return { message: 'Partner deleted successfully' };
  }
}
