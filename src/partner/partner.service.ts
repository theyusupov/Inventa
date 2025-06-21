import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPartnerDto: CreatePartnerDto) {
    const partner = await this.prisma.partner.create({
      data: createPartnerDto,
    });
    return { message: 'Partner created successfully'};
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

  async update(id: string, updatePartnerDto: UpdatePartnerDto) {
    const partner = await this.prisma.partner.update({
      where: { id },
      data: updatePartnerDto,
    });
    return { message: 'Partner updated successfully'};
  }

  async remove(id: string) {
    await this.prisma.partner.delete({ where: { id } });
    return { message: 'Partner deleted successfully' };
  }
}
