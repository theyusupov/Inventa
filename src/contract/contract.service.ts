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

    if(partner.role==='SELLER') throw new BadRequestException(`You can't make contract with ${partner.role.toLowerCase()}s`);

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
