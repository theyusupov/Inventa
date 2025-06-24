import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@Injectable()
export class DebtService {
  constructor(private readonly prisma: PrismaService) {}

  // async create(dto: CreateDebtDto, userId: string) {
  //   const contract = await this.prisma.contract.findUnique({ where: { id: dto.contractId } });
  //   if (!contract) {
  //     throw new BadRequestException('Contract not found');
  //   }

  //   const debt = await this.prisma.debt.create({ data: dto });

  //   await this.prisma.actionHistory.create({
  //     data: {
  //       tableName: 'debt',
  //       actionType: 'CREATE',
  //       recordId: debt.id,
  //       newValue: debt,
  //       comment: 'Debt created',
  //       userId,
  //     },
  //   });

  //   return { message: 'Debt created successfully', debt };
  // }

  async findAll() {
    return this.prisma.debt.findMany({
      include: {
        contract: true,
        payments: true,
      },
    });
  }

  async findOne(id: string) {
    let debt = await this.prisma.debt.findUnique({
      where: { id },
      include: { payments: true },
    });
    if(!debt)throw new BadRequestException('Debt not found');
     return {message:"Debt created sucessfully!", debt}
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.debt.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Debt not found');

    await this.prisma.debt.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'debt',
        actionType: 'DELETE',
        recordId: id,
        oldValue: existing,
        comment: 'Debt deleted',
        userId,
      },
    });

    return { message: 'Debt deleted successfully' };
  }

  // async update(id: string, dto: UpdateDebtDto, userId: string) {
  //   const existing = await this.prisma.debt.findUnique({ where: { id } });
  //   if (!existing) throw new BadRequestException('Debt not found');

  //   const updated = await this.prisma.debt.update({
  //     where: { id },
  //     data: {
  //       ...dto,
  //       updatedAt: new Date(),
  //     },
  //   });

  //   await this.prisma.actionHistory.create({
  //     data: {
  //       tableName: 'debt',
  //       actionType: 'UPDATE',
  //       recordId: updated.id,
  //       oldValue: existing,
  //       newValue: updated,
  //       comment: 'Debt updated',
  //       userId,
  //     },
  //   });

  //   return { message: 'Debt updated successfully', updated};
  // }
}
