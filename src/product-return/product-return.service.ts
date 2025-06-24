import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

    await this.prisma.product.update({where:{id:contract.productId},data:{quantity:product.quantity+contract.quantity}})
    await this.prisma.purchase.update({where:{productId:contract.productId},data:{quantity:product.quantity+contract.quantity}})
    await this.prisma.contract.update({where:{id:dto.contractId},data:{status:"CANCELLED"}});
    await this.prisma.actionHistory.create({
      data: {
        tableName: 'contract',
        recordId: contract.id,
        actionType: 'DELETE',
        oldValue: contract,
        comment: 'Contract canceled because cutomer returned product',
        userId,
      },
    });

    return { message: 'Product return recorded successfully', productReturn };
  }

  async findAll() {
    return await this.prisma.productReturn.findMany({
      include: {
        contract: true,
        reason: true,
      },
    });
  }

  async findOne(id: string) {
    let returnedProduct = await this.prisma.productReturn.findUnique({
      where: { id },
      include: {
        contract: true,
        reason: true,
      },
    })
    if (!returnedProduct) throw new NotFoundException('Returned product not found');
    return returnedProduct;
  }

  async update(id: string, dto: UpdateProductReturnDto, userId: string) {
    const existing = await this.prisma.productReturn.findUnique({
      where: { id },
      include: { contract: true },
    });
    if (!existing) throw new BadRequestException('Product return not found');

    const contract = await this.prisma.contract.findUnique({
      where: { id: existing.contractId },
    });
    if (!contract) throw new BadRequestException('Related contract not found');

    const product = await this.prisma.product.findUnique({
      where: { id: contract.productId },
    });
    if (!product) throw new BadRequestException('Product not found');

    const purchase = await this.prisma.purchase.findFirst({
      where: { productId: contract.productId },
    });
    if (!purchase) throw new BadRequestException('Purchase not found');

    if (dto.contractId && dto.contractId !== existing.contractId) {
      throw new BadRequestException("Cannot change the contract of a return. Delete and re-create instead.");
    }

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

    return { message: 'Product return updated successfully', updated };
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
