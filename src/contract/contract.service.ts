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
        sellPrice: product.sellPrice,
        userId,
      },
    });

    await this.prisma.debt.create({
      data: {
        total: product.sellPrice,
        repaymentPeriod: dto.repaymentPeriod,
        contractId: contract.id
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'contract',
        actionType: 'CREATE',
        recordId: contract.id,
        newValue: contract,
        comment: 'Contract created',
        userId,
      }
    });

    return { message: 'Contract created successfully' };
  }

  async findAll() {
    return this.prisma.contract.findMany();
  }

  async findOne(id: string) {
    return this.prisma.contract.findUnique({ where: { id }, include: { debts: true, returns: true } });
  }

  async update(id: string, dto: UpdateContractDto, userId: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Contract not found');

    const updated = await this.prisma.contract.update({
      where: { id },
      data: dto,
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'contract',
        actionType: 'UPDATE',
        recordId: updated.id,
        oldValue: existing,
        newValue: updated,
        comment: 'Contract updated',
        userId,
      }
    });

    return { message: 'Contract updated successfully' };
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Contract not found');

    await this.prisma.contract.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'contract',
        actionType: 'DELETE',
        recordId: id,
        oldValue: existing,
        comment: 'Contract deleted',
        userId,
      }
    });

    return { message: 'Contract deleted successfully' };
  }
}
