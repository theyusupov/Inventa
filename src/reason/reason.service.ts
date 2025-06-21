import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReasonDto } from './dto/create-reason.dto';
import { UpdateReasonDto } from './dto/update-reason.dto';

@Injectable()
export class ReasonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReasonDto) {
    const reason = await this.prisma.reason.create({
      data: dto,
    });
    return { message: 'Reason created successfully' };
  }

  async findAll() {
    return this.prisma.reason.findMany();
  }

  async findOne(id: string) {
    return this.prisma.reason.findUnique({
      where: { id }
    });
  }

  async update(id: string, dto: UpdateReasonDto) {
    const reason = await this.prisma.reason.findUnique({ where: { id } });
    if (!reason) throw new BadRequestException('Reason not found');

    const updated = await this.prisma.reason.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    return { message: 'Reason updated successfully' };
  }

  async remove(id: string) {
    await this.prisma.reason.delete({ where: { id } });
    return { message: 'Reason deleted successfully' };
  }
}
