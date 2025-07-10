import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { Prisma } from 'generated/prisma';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ProductReturnService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductReturnDto, userId: string) {
    const { isNew, contractId, reasonId } = dto;

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        partner: true,
        debts: true,
        products: true,
      },
    });
    if (!contract) throw new BadRequestException('Contract not found');

    const reason = await this.prisma.reason.findUnique({ where: { id: reasonId } });
    if (!reason) throw new BadRequestException('Reason not found');

    const partner = contract.partner;
    if (!partner) throw new BadRequestException('Partner not found');

    const debt = contract.debts[0];
    if (!debt) throw new BadRequestException('Debt not found');

    // ✅ startTotal null bo‘lsa => debt.total
    const startTotal = contract.startTotal ?? debt.total;
    const restoreAmount = startTotal - debt.total;

    for (const cp of contract.products) {
      const product = await this.prisma.product.findUnique({
        where: { id: cp.productId },
      });
      if (!product) throw new NotFoundException(`Product ${cp.productId} not found`);

      const qtyToRestore = isNew ? cp.quantity : 0;

      if (isNew) {
        await this.prisma.product.update({
          where: { id: product.id },
          data: {
            quantity: product.quantity + qtyToRestore,
            isActive: product.quantity + qtyToRestore > 0,
          },
        });
      }
    }

    await this.prisma.partner.update({
      where: { id: partner.id },
      data: {
        balance: partner.balance + debt.total,
      },
    });

    await this.prisma.debt.delete({
      where: { id: debt.id },
    });

    await this.prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: 'CANCELLED',
      },
    });

    const productReturn = await this.prisma.productReturn.create({
      data: {
        isNew,
        contractId,
        reasonId,
        restoreAmount,
      },
    });

    await this.prisma.actionHistory.createMany({
      data: [
        {
          tableName: 'productReturn',
          actionType: 'CREATE',
          recordId: productReturn.id,
          newValue: productReturn,
          userId,
          comment: 'Product returned successfully',
        },
        {
          tableName: 'contract',
          actionType: 'DELETE',
          recordId: contract.id,
          oldValue: contract,
          userId,
          comment: 'Contract cancelled due to product return',
        },
        {
          tableName: 'debt',
          actionType: 'DELETE',
          recordId: debt.id,
          oldValue: debt,
          userId,
          comment: 'Debt deleted due to contract cancel',
        },
      ],
    });

    return { message: 'Product return recorded successfully', productReturn };
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

    const where: Prisma.ProductReturnWhereInput = search
      ? {
          contract: {
            partner: {
              is: {
                fullName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        }
      : {};

    const returns = await this.prisma.productReturn.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.productReturn.count({ where });

    return {
      data: returns,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const productReturn = await this.prisma.productReturn.findUnique({
      where: { id },
      include: {
        contract: true,
        reason: true,
      },
    });

    if (!productReturn) throw new NotFoundException('Product return not found');

    return productReturn;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.productReturn.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product return not found');

    await this.prisma.productReturn.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'productReturn',
        recordId: id,
        actionType: 'DELETE',
        oldValue: existing,
        userId,
        comment: 'Product return deleted',
      },
    });

    return { message: 'Product return deleted successfully' };
  }


}
