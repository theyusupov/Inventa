import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { Prisma } from 'generated/prisma';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto, userId: string) {
    const { productId, partnerId, buyPrice, quantity } = dto;

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new BadRequestException('Partner not found');
    if(partner.role==='CUSTOMER') throw new BadRequestException('You can not buy product from customers');

    const finalBuyPrice = buyPrice ?? product.buyPrice;
    const finalQuantity = quantity ?? 0;
    if(finalQuantity===0)throw new BadRequestException("Quantity can not be 0")
   
    await this.prisma.product.update({where:{id:product.id},data:{quantity:finalQuantity}})

    const purchase = await this.prisma.purchase.create({
      data: {
        ...dto,
        buyPrice: finalBuyPrice,
        quantity:finalQuantity,
        userId,
      },
    });

    const increaseAmount = finalBuyPrice * finalQuantity;

    await this.prisma.partner.update({
      where: { id: partner.id },
      data: {
        balance: partner.balance + increaseAmount,
      },
    });

    const productBuyPrice = product.quantity * product.buyPrice;
    const purchaseBuyPrice = purchase.quantity * purchase.buyPrice;
    const newBuyPrice  = (productBuyPrice + purchaseBuyPrice) / (product.quantity + purchase.quantity)
    const newSellPrice =  newBuyPrice + ((30 * newBuyPrice) / 100)
    await this.prisma.product.update({
      where: { id: product.id },
      data: {
        isActive:true,
        buyPrice: newBuyPrice,
        sellPrice: newSellPrice,
        quantity: product.quantity+finalQuantity
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'purchase',
        recordId: purchase.id,
        actionType: 'CREATE',
        userId,
        newValue: purchase,
        comment: 'Purchase created',
      },
    });

    return { message: 'Purchase created successfully', purchase };
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

    const where: Prisma.PurchaseWhereInput = search
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
      : {};

    const purchases = await this.prisma.purchase.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.purchase.count({ where });

    return {
      data: purchases,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        product: true,
        partner: true,
        user: true,
      },
    });

    if (!purchase) throw new NotFoundException('Purchase not found');

    return purchase;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.purchase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Purchase not found');

    await this.prisma.purchase.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'purchase',
        recordId: id,
        actionType: 'DELETE',
        oldValue: existing,
        userId,
        comment: 'Purchase deleted',
      },
    });

    return { message: 'Purchase deleted successfully' };
  }

  async exportToExcel(res: Response) {
      const purchases = await this.prisma.purchase.findMany({
        include: {
          user: true,
          partner: true,
          product: true,
        },
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Purchases');

      worksheet.addRow([
        '№',
        'Purchase ID',
        'Product Name',
        'Buy Price',
        'Quantity',
        'Total',
        'Partner Name',
        'User Name',
        'Comment',
        'Created At',
        'Updated At',
      ]);

      purchases.forEach((purchase, index) => {
        worksheet.addRow([
          index + 1,
          purchase.id,
          purchase.product?.name || '—',
          purchase.buyPrice,
          purchase.quantity,
          purchase.buyPrice * purchase.quantity,
          purchase.partner?.fullName || '—',
          purchase.user?.fullName || '—',
          purchase.comment,
          purchase.createdAt?.toISOString().split('T')[0],
          purchase.updatedAt?.toISOString().split('T')[0],
        ]);
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=purchases.xlsx',
      );

      await workbook.xlsx.write(res);
      res.end();
    }
}
