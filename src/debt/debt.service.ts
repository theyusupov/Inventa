import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@Injectable()
export class DebtService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDebtDto) {
    const contract = await this.prisma.contract.findUnique({ where: { id: dto.contractId } });
    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    const debt = await this.prisma.debt.create({
      data: dto,
    });

    return { message: 'Debt created successfully' };
  }

  async findAll() {
    return this.prisma.debt.findMany({
      include: {
        contract: true,
        payments: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.debt.findUnique({
      where: { id },
      include: { payments: true },
    });
  }

  async remove(id: string) {
    await this.prisma.debt.delete({ where: { id } });
    return { message: 'Debt deleted successfully' };
  }

  async update(id: string, dto: UpdateDebtDto) {
    const existing = await this.prisma.debt.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Debt not found');

    const updated = await this.prisma.debt.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    return { message: 'Debt updated successfully' };
  }

}
