import {
  Injectable,
  BadRequestException,
  NotFoundException,
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

    let parBalance = 0;

    if(partner.balance>0){
      parBalance = partner.balance
    }
  
    const price = dtoSellPrice ?? product.sellPrice;
    const usedQuantity =  quantity;
    const total = ( price * usedQuantity) - parBalance;
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
        data: { balance: partner.balance - (price*usedQuantity) },
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

  async update(id: string, dto: Partial<CreateContractDto>, userId: string) {
    const existingContract = await this.prisma.contract.findUnique({
      where: { id },
      include: { product: true, partner: true, debts: true },
    });

    if (!existingContract) throw new NotFoundException('Contract not found');

    const { product, partner, debts } = existingContract;

    const oldQuantity = existingContract.quantity;
    const oldPrice = existingContract.sellPrice;
    const oldTotal = existingContract.startTotal;

    const newQuantity = dto.quantity ?? oldQuantity;
    const newPrice = dto.sellPrice ?? oldPrice;
    const repaymentPeriod = dto.repaymentPeriod ?? existingContract.repaymentPeriod;

    const quantityDifference = newQuantity - oldQuantity;

    if (quantityDifference > 0 && product.quantity < quantityDifference) {
      throw new BadRequestException('Product quantity is not enough in stock');
    }

    const updatedProductQuantity = product.quantity - quantityDifference;
    const newTotal = newQuantity * newPrice;
    const newMonthlyPayment = newTotal / repaymentPeriod;

    const isCompleted = existingContract.status === 'COMPLETED';
    const previousDebt = debts?.[0]; 

    let amountAlreadyPaid;
    if (isCompleted && previousDebt) {
      amountAlreadyPaid = oldTotal; 
    } else if (previousDebt) {
      amountAlreadyPaid = oldTotal! - previousDebt.total;
    }

    const updatedDebtAmount = newTotal - amountAlreadyPaid;

    if (updatedDebtAmount < 0) {
      throw new BadRequestException('New total is less than already paid amount');
    }

    const updatedContract = await this.prisma.contract.update({
      where: { id },
      data: {
        ...dto,
        quantity: newQuantity,
        sellPrice: newPrice,
        status:"ONGOING",
        repaymentPeriod,
        startTotal: newTotal,
        monthlyPayment: newMonthlyPayment,
      },
    });

    await this.prisma.product.update({
      where: { id: product.id },
      data: {
        quantity: updatedProductQuantity,
        isActive: updatedProductQuantity > 0,
      },
    });

    if (previousDebt) {
      await this.prisma.debt.update({
        where: { id: previousDebt.id },
        data: {
          total: updatedDebtAmount,
          remainingMonths: repaymentPeriod,
        },
      });
    } else if (updatedDebtAmount > 0) {
      await this.prisma.debt.create({
        data: {
          contractId: id,
          total: updatedDebtAmount,
          remainingMonths: repaymentPeriod,
        },
      });
    }

    const balanceChange = oldTotal! - newTotal;
    await this.prisma.partner.update({
      where: { id: partner.id },
      data: {
        balance: partner.balance + balanceChange,
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'contract',
        actionType: 'UPDATE',
        recordId: id,
        oldValue: existingContract,
        newValue: updatedContract,
        comment: 'Contract updated (dynamic balance + debt adjusted)',
        userId,
      },
    });

    return {
      message: 'Contract updated successfully',
      contract: updatedContract,
    };
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

  async exportToExcel(res: Response) {
    const contracts = await this.prisma.contract.findMany({
      include: {
        partner: true,
        product: true,
        user: true,
        debts: true,
        returns: true,
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contracts');

    worksheet.addRow([
      '№',
      'Contract ID',
      'Partner Name',
      'Partner Phone',
      'Product Name',
      'Quantity',
      'Price',
      'Start Total',
      'Monthly Payment',
      'Repayment Period',
      'Contract Status',
      'User',
      'Created At',
      'Updated At',
      'Debt Count',
      'Return Count',
    ]);

    contracts.forEach((contract, index) => {
      worksheet.addRow([
        index + 1,
        contract.id,
        contract.partner?.fullName || '—',
        contract.partner?.phoneNumbers || '—',
        contract.product?.name || '—',
        contract.quantity,
        contract.sellPrice,
        contract.startTotal,
        contract.monthlyPayment,
        contract.repaymentPeriod,
        contract.status || '—',
        contract.user?.fullName || '—',
        contract.createdAt?.toISOString().split('T')[0] || '',
        contract.updatedAt?.toISOString().split('T')[0] || '',
        contract.debts?.length || 0,
        contract.returns?.length || 0,
      ]);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=contracts.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }
}
