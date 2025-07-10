import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Prisma } from 'generated/prisma';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateContractDto, userId: string) {
    const { partnerId, repaymentPeriod, products } = dto;

   const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new BadRequestException('Partner not found');

    const productChecks = await Promise.all(
    products.map((product) =>
      this.prisma.product.findUnique({ where: { id: product.productId } })
    )
  );
    for (const [index, product] of productChecks.entries()) {
      if (!product) {
        throw new NotFoundException(
          `Product with id ${products[index].productId} not found`
        );
      }
    }

    const total = products.reduce(
  (acc, product) => acc + product.sellPrice * product.quantity,
  0,
    );

    const contract = await this.prisma.contract.create({
      data: {
        partnerId,
        repaymentPeriod,
        status: 'ONGOING',
        startTotal: total,
        userId,
      },
    });

    await this.prisma.contractProduct.createMany({
      data: products.map((product) => ({
        contractId: contract.id,
        productId: product.productId,
        quantity: product.quantity,
        sellPrice: product.sellPrice,
      })),
    });

  


    const debt = await this.prisma.debt.create({
      data: {
        total,
        contractId: contract.id,
      },
    });

    await this.prisma.partner.update({
      where: { id: partnerId },
      data: { balance: partner.balance - total },
    });


  for (const item of products) {
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });


    const newQuantity = product!.quantity - item.quantity;

    await this.prisma.product.update({
      where: { id: item.productId },
      data: {
        quantity: newQuantity,
        isActive: newQuantity > 0,
      },
    });
  }


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


    return contract;
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
        products: true,
        user: true,
      },
    });

    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async update(dto: UpdateContractDto, contractId: string, userId: string) {
    const { products } = dto;

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        products: true,
        partner: true,
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const partner = contract.partner;
    if (!partner) throw new NotFoundException('Partner not found for this contract');

    let updatedBalance: number = Number(partner.balance) || 0;

    for (const item of products!) {
      const contractProduct = contract.products.find(
        p => p.productId === item.productId,
      );
      if (!contractProduct) {
        throw new NotFoundException(
          `Product ${item.productId} not found in this contract`,
        );
      }

      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      // eski qiymatlar
      const oldQuantity = contractProduct.quantity ;
      const oldPrice = contractProduct.sellPrice ;
      const oldTotal = oldQuantity * oldPrice;

      // yangi qiymatlar
      const newQuantity = item.quantity || 0;
      const newPrice = item.sellPrice || 0;
      const newTotal = newQuantity * newPrice;

      // productning stokini yangilash
      const quantityDiff = newQuantity - oldQuantity;
      const updatedProductQuantity = product.quantity - quantityDiff;

      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          quantity: updatedProductQuantity,
          isActive: updatedProductQuantity > 0,
        },
      });

      // partner balansini yangilash
      updatedBalance += oldTotal - newTotal;

      // contractProduct ni yangilash
      await this.prisma.contractProduct.update({
        where: { id: contractProduct.id },
        data: {
          quantity: newQuantity,
          sellPrice: newPrice,
        },
      });
    }

    // partnerning yangilangan balansini saqlash
    await this.prisma.partner.update({
      where: { id: partner.id },
      data: {
        balance: Math.round(updatedBalance),
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'contract',
        actionType: 'UPDATE',
        recordId: contract.id,
        comment: 'Contract updated',
        userId,
      },
    });

    return { message: 'Contract updated successfully' };
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Contract not found');

    await this.prisma.contract.delete({ where: { id } });
    await this.prisma.actionHistory.create({
      data: {
        tableName: 'contract',
        recordId: id,
        actionType: 'DELETE',
        oldValue: existing,
        userId,
        comment: 'Contract deleted',
      },
    });

    return { message: 'Contract deleted successfully' };
  }
}
