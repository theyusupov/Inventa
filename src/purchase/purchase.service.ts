import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPurchaseDto: CreatePurchaseDto, userId: string) {
    const { productId, partnerId } = createPurchaseDto;

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new BadRequestException('Partner not found');

    const purchase = await this.prisma.purchase.create({
      data: { ...createPurchaseDto, buyPrice:createPurchaseDto.buyPrice || product.buyPrice, quantity: createPurchaseDto.quantity || product.quantity, userId },
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

  async findAll() {
    return await this.prisma.purchase.findMany({ include: { product: true, partner: true } });
  }

  async findOne(id: string) {
    let purchase = await this.prisma.purchase.findUnique({ where: { id } });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase
  }

  async remove(id: string, userId: string) {
    const oldPurchase = await this.prisma.purchase.findUnique({ where: { id } });
    if (!oldPurchase) throw new NotFoundException('Purchase not found');

    await this.prisma.purchase.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'purchase',
        recordId: oldPurchase.id,
        actionType: 'DELETE',
        userId,
        oldValue: oldPurchase,
        comment: 'Purchase deleted',
      },
    });

    return { message: 'Purchase deleted successfully' };
  }
}
