import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { UpdateProductReturnDto } from './dto/update-product-return.dto';
import { Decimal } from 'generated/prisma/runtime/library';
import { Prisma } from 'generated/prisma';

@Injectable()
export class ProductReturnService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductReturnDto, userId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: dto.contractId } });
    if (!contract) throw new BadRequestException('Contract not found');

    const debt = await this.prisma.debt.findFirst({where:{contractId:contract.id}});
    if (!debt) throw new BadRequestException('Debt not found');

    const product = await this.prisma.product.findUnique({ where: { id: contract.productId } });
    if (!product) throw new BadRequestException('Product not found');

    const reason = await this.prisma.reason.findUnique({ where: { id: dto.reasonId } });
    if (!reason) throw new BadRequestException('Reason not found');

    const monthlyPayment = contract.monthlyPayment ?? 0;
    const remainingMonths = debt.remainingMonths ?? 0;

    const newBalance = remainingMonths * monthlyPayment;


    let partner = await this.prisma.partner.findFirst({where:{id:contract.partnerId}})
    if (!partner) throw new BadRequestException('Partner not found');
    await this.prisma.partner.update({where:{id:partner.id},data:{balance:partner.balance+newBalance}})

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

    const where: Prisma.ProductReturnWhereInput | undefined = search
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
      : undefined;

    const returns = await this.prisma.productReturn.findMany({
      where,
      orderBy: {
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        contract: {
          include: {
            partner: true,
          },
        },
        reason: true,
      },
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
