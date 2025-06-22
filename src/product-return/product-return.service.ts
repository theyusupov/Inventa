import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { UpdateProductReturnDto } from './dto/update-product-return.dto';

@Injectable()
export class ProductReturnService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductReturnDto, userId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: dto.contractId } });
    if (!contract) throw new BadRequestException('Contract not found');

    const product = await this.prisma.product.findUnique({ where: { id: contract.productId } });
    if (!product) throw new BadRequestException('Product not found');

    const reason = await this.prisma.reason.findUnique({ where: { id: dto.reasonId } });
    if (!reason) throw new BadRequestException('Reason not found');

    if (!dto.isNew) {
      await this.prisma.actionHistory.create({
        data: {
          tableName: 'productReturn',
          recordId: product.id,
          actionType: 'REJECT',
          oldValue: product,
          comment: 'Attempted to return used product',
          userId,
        },
      });
      throw new BadRequestException('Sorry, we cannot accept used products!');
    }

    const productReturn = await this.prisma.productReturn.create({
      data: dto,
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'productReturn',
        recordId: productReturn.id,
        actionType: 'CREATE',
        oldValue: undefined,
        newValue: productReturn,
        comment: 'Product returned successfully',
        userId,
      },
    });

    return { message: 'Product return recorded successfully' };
  }

  async findAll() {
    return this.prisma.productReturn.findMany({
      include: {
        contract: true,
        reason: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.productReturn.findUnique({
      where: { id },
      include: {
        contract: true,
        reason: true,
      },
    });
  }

  async update(id: string, dto: UpdateProductReturnDto, userId: string) {
    const existing = await this.prisma.productReturn.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Product return not found');

    const updated = await this.prisma.productReturn.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'productReturn',
        recordId: id,
        actionType: 'UPDATE',
        oldValue: existing,
        newValue: updated,
        comment: 'Product return updated',
        userId,
      },
    });

    return { message: 'Product return updated successfully' };
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.productReturn.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Product return not found');

    await this.prisma.productReturn.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'productReturn',
        recordId: id,
        actionType: 'DELETE',
        oldValue: existing,
        comment: 'Product return deleted',
        userId,
      },
    });

    return { message: 'Product return deleted successfully' };
  }
}
