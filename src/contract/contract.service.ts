import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractDto, userId: string) {
    const { productId, partnerId } = dto;

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new BadRequestException('Partner not found');

    const contract = await this.prisma.contract.create({
      data: {
        ...dto,
        userId,
      },
    });

    return { message: 'Contract created successfully' };
  }

  async findAll() {
    return this.prisma.contract.findMany();
  }

  async findOne(id: string) {
    return this.prisma.contract.findUnique({ where: { id }, include: { debts: true, returns: true } });
  }

  async remove(id: string) {
    await this.prisma.contract.delete({ where: { id } });
    return { message: 'Contract deleted successfully' };
  }

  async update(id: string, dto: UpdateContractDto) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Contract not found');

    const updated = await this.prisma.contract.update({
      where: { id },
      data: dto,
    });

    return { message: 'Contract updated successfully' };
  }
}
