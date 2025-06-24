import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

    if(product.quantity<dto.quantity) throw new BadRequestException('Quantity of product not enough');

    const contract = await this.prisma.contract.create({
      data: {
        ...dto,
        sellPrice: product.sellPrice,
        userId,
        status:'ONGOING'
      },
    });

    let purchase = await this.prisma.purchase.findFirst({ where: { productId: product.id}});
    if (!purchase) throw new BadRequestException('Purchase not found');

    await this.prisma.product.update({ where: { id: productId }, data:{quantity: product.quantity-dto.quantity} });
    await this.prisma.purchase.update({ where: { id: purchase.id }, data:{quantity: product.quantity-dto.quantity} });



    let totalDebt = product.sellPrice * dto.quantity
    let debt = await this.prisma.debt.create({
      data: {
        total: totalDebt,
        remainingMonths: dto.repaymentPeriod,
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

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'debt',
        actionType: 'CREATE',
        recordId: debt.id,
        newValue: debt,
        comment: 'Debt created',
        userId,
      }
    });

    return { message: 'Contract created successfully', contract};
  }

  async findAll() {
    return this.prisma.contract.findMany();
  }

  async findOne(id: string) {
    let contract = await  this.prisma.contract.findUnique({ where: { id }, include: { debts: true, returns: true } })
    if(!contract)throw new NotFoundException('Contract not found');
    return contract;
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

    return { message: 'Contract updated successfully', updated };
  }
}
