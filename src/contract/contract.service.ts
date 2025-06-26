import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractDto, userId: string) {
    const { productId, partnerId, quantity, repaymentPeriod, sellPrice: dtoSellPrice } = dto;

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    const category = await this.prisma.category.findUnique({ where: { id: product.categoryId } });
    if (!category) throw new BadRequestException('Category not found');

    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new BadRequestException('Partner not found');

    if (!product.isActive) throw new BadRequestException("This product isn't active at the moment");
    if (product.quantity < quantity) throw new BadRequestException('Product quantity is not enough');

  
    const price = dtoSellPrice ?? product.sellPrice;
    const usedQuantity =  quantity;
    const total = price * usedQuantity;
    const monthlyPayment = total / (repaymentPeriod ?? category.repaymentPeriod);

    const contract = await this.prisma.contract.create({
      data: {
        ...dto,
        quantity: usedQuantity,
        userId,
        status: 'ONGOING',
        startTotal: total,
        monthlyPayment,
        sellPrice: price,
        repaymentPeriod: repaymentPeriod ?? category.repaymentPeriod
      },
    });

      const newQuantity = product.quantity - quantity;

      await this.prisma.product.update({
        where: { id: productId },
        data: {
          quantity: newQuantity,
          isActive: newQuantity > 0,
        },
      });

      await this.prisma.partner.update({
        where: { id: partnerId },
        data: { balance: partner.balance - total },
      });
    

    const debt = await this.prisma.debt.create({
      data: {
        total,
        remainingMonths: (repaymentPeriod ?? category.repaymentPeriod),
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

    const where: Prisma.ContractWhereInput | undefined = search
      ? {
          partner: {
            is: {
              fullName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        }
      : undefined;

    const contracts = await this.prisma.contract.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.contract.count({ where });

    return {
      data: contracts,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        debts: true,
        returns: true,
        partner: true,
        product: true,
        user: true,
      },
    });

    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async update(id: string, dto: CreateContractDto, userId: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Contract not found');

    const { productId, partnerId, quantity, repaymentPeriod, sellPrice: dtoSellPrice } = dto;

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new BadRequestException('Partner not found');

    if (!product.isActive) throw new BadRequestException("This product isn't active at the moment");
    if (product.quantity < quantity) throw new BadRequestException('Product quantity is not enough');

    const isSeller = partner.role === 'SELLER';
    const price = isSeller ? product.buyPrice : dtoSellPrice ?? product.sellPrice;
    const usedQuantity = isSeller ? product.quantity : quantity;
    const total = price * usedQuantity;
    const monthlyPayment = total / (repaymentPeriod??NaN);

    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        ...dto,
        quantity: usedQuantity,
        userId,
        status: 'ONGOING',
        startTotal: total,
        monthlyPayment,
        ...(isSeller ? { buyPrice: price } : { sellPrice: price }),
      },
    });

    const purchase = await this.prisma.purchase.findFirst({ where: { productId } });
    if (!purchase) throw new BadRequestException('Purchase not found');

    if (!isSeller) {
      const newQuantity = product.quantity - quantity;

      await this.prisma.product.update({
        where: { id: productId },
        data: {
          quantity: newQuantity,
          isActive: newQuantity > 0,
        },
      });

      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { quantity: newQuantity },
      });

      await this.prisma.partner.update({
        where: { id: partnerId },
        data: { balance: partner.balance - total },
      });
    }

    const oldDebt = await this.prisma.debt.findFirst({ where: { contractId: id } });
    if (oldDebt) {
      await this.prisma.debt.delete({ where: { id: oldDebt.id } });
    }

    const newDebt = await this.prisma.debt.create({
      data: {
        total,
        remainingMonths: repaymentPeriod,
        contractId: id,
      },
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
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'debt',
        actionType: 'UPDATE',
        recordId: newDebt.id,
        oldValue: oldDebt ?? undefined,
        newValue: newDebt,
        comment: 'Debt updated',
        userId,
      },
    });

    return { message: 'Contract updated successfully', contract: updated };
  }
}
