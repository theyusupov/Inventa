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

    if (product.quantity < dto.quantity)
      throw new BadRequestException('Quantity of product not enough');

    const sellPrice = dto.sellPrice || product.sellPrice;
    const total = sellPrice * dto.quantity;

    const contract = await this.prisma.contract.create({
      data: {
        ...dto,
        sellPrice,
        userId,
        status: 'ONGOING',
        startTotal: total,
        monthlyPayment: total / dto.repaymentPeriod,
      },
    });

    const purchase = await this.prisma.purchase.findFirst({ where: { productId: product.id } });
    if (!purchase) throw new BadRequestException('Purchase not found');

    const newQuantity = product.quantity - dto.quantity;

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        quantity: newQuantity,
        isActive: newQuantity === 0 ? false : product.isActive, // isActive false agar quantity 0
      },
    });

    await this.prisma.purchase.update({
      where: { id: purchase.id },
      data: { quantity: newQuantity },
    });

    await this.prisma.partner.update({
      where: { id: partner.id },
      data: { balance: partner.balance - total },
    });

    const debt = await this.prisma.debt.create({
      data: {
        total,
        remainingMonths: dto.repaymentPeriod,
        contractId: contract.id,
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
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'debt',
        actionType: 'CREATE',
        recordId: debt.id,
        newValue: debt,
        comment: 'Debt created',
        userId,
      },
    });

    return { message: 'Contract created successfully', contract };
  }

  async findAll() {
    return await this.prisma.contract.findMany();
  }

  async findOne(id: string) {
    let contract = await  this.prisma.contract.findUnique({ where: { id }, include: { debts: true, returns: true } })
    if(!contract)throw new NotFoundException('Contract not found');
    return contract;
  }

  async update(id: string, dto: UpdateContractDto, userId: string) {
    const existing = await this.prisma.contract.findUnique({
      where: { id },
      include: { debts: true },
    });
    if (!existing) throw new BadRequestException('Contract not found');

    const product = await this.prisma.product.findUnique({ where: { id: existing.productId } });
    if (!product) throw new BadRequestException('Product not found');

    const purchase = await this.prisma.purchase.findFirst({ where: { productId: product.id } });
    if (!purchase) throw new BadRequestException('Purchase not found');

    const partner = await this.prisma.partner.findUnique({ where: { id: existing.partnerId } });
    if (!partner) throw new BadRequestException('Partner not found');

    const oldQuantity = existing.quantity;
    const newQuantity = dto.quantity ?? oldQuantity;
    const diff = newQuantity - oldQuantity;

    if (diff > 0 && product.quantity < diff)
      throw new BadRequestException('Not enough product in stock');

    const sellPrice = dto.sellPrice ?? existing.sellPrice;
    const repaymentPeriod = dto.repaymentPeriod ?? existing.repaymentPeriod;
    const newStartTotal = sellPrice * newQuantity;
    const newMonthlyPayment = newStartTotal / repaymentPeriod;

    const updatedContract = await this.prisma.contract.update({
      where: { id },
      data: {
        ...dto,
        startTotal: newStartTotal,
        monthlyPayment: newMonthlyPayment,
      },
    });

    const updatedProductQuantity = product.quantity - diff;

    await this.prisma.product.update({
      where: { id: product.id },
      data: {
        quantity: updatedProductQuantity,
        isActive: updatedProductQuantity === 0 ? false : product.isActive,
      },
    });

    await this.prisma.purchase.update({
      where: { id: purchase.id },
      data: { quantity: purchase.quantity - diff },
    });

    const oldStartTotal = existing.startTotal ?? existing.sellPrice * existing.quantity;
    const balanceDiff = oldStartTotal - newStartTotal;

    await this.prisma.partner.update({
      where: { id: partner.id },
      data: { balance: partner.balance + balanceDiff },
    });

    if (existing.debts.length) {
      const debt = existing.debts[0];

      await this.prisma.debt.update({
        where: { id: debt.id },
        data: {
          total: newStartTotal,
          remainingMonths: repaymentPeriod,
        },
      });

      await this.prisma.actionHistory.create({
        data: {
          tableName: 'debt',
          actionType: 'UPDATE',
          recordId: debt.id,
          oldValue: debt,
          newValue: {
            ...debt,
            total: newStartTotal,
            remainingMonths: repaymentPeriod,
          },
          comment: 'Debt updated due to contract update',
          userId,
        },
      });
    }

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'contract',
        actionType: 'UPDATE',
        recordId: updatedContract.id,
        oldValue: existing,
        newValue: updatedContract,
        comment: 'Contract updated',
        userId,
      },
    });

    return { message: 'Contract updated successfully', updatedContract };
  }


}
