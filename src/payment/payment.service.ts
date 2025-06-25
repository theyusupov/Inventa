import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, userId: string) {
    const debt = await this.prisma.debt.findFirst({ where: { id: dto.debtId } });
    if (!debt) throw new BadRequestException("Debt not found");

    let contract = await this.prisma.contract.findFirst({where:{id:debt.contractId}})
    if (contract?.status==='CANCELLED'||contract?.status==='COMPLETED') throw new BadRequestException("This contract is invalid.");


    const payment = await this.prisma.payment.create({
      data: { ...dto, userId },
    });
    const remainingMonths = debt.remainingMonths ?? 0;
    const monthsPaid = payment.monthsPaid ?? 0;
    const newRemainingMonths = remainingMonths - monthsPaid;
    const newTotal = debt.total - payment.amount;
    await this.prisma.debt.update({ where: { id: payment.debtId }, data: { total: newTotal, remainingMonths: newRemainingMonths} });
    const partner = await this.prisma.partner.findFirst({ where: { id: dto.partnerId } });
    if(dto.type==='OUT'&&partner?.role==='CUSTOMER'||dto.type==='IN'&&partner?.role==='SELLER'){
      throw new BadRequestException("Not matched payment type and partners role")
    }

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'payment',
        actionType: 'CREATE',
        recordId: payment.id,
        newValue: payment,
        userId,
        comment: 'Payment created and debt updated',
      },
    });

    const contractCheck = await this.prisma.debt.findFirst({ where: { id: dto.debtId } });
    if (contractCheck?.remainingMonths===0&&contractCheck?.total===0){
     await this.prisma.contract.update({where:{id:debt.contractId},data:{status:"COMPLETED"}})
    }

    if(payment.type==='OUT'){
      await this.prisma.partner.update({where:{id:partner?.id},data:{balance:partner?.balance!-dto.amount}})
    }
    if(payment.type==='IN'){
        await this.prisma.partner.update({where:{id:partner?.id},data:{balance:partner?.balance!+dto.amount}})
    }
    return { message: 'Payment created successfully', payment };
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

    const where: Prisma.PaymentWhereInput | undefined = search
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

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: {
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        partner: true,
        debt: true,
        user: true,
      },
    });

    const total = await this.prisma.payment.count({ where });

    return {
      data: payments,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }


  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto, userId: string) {
    const existing = await this.prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payment not found');

    const debt = await this.prisma.debt.findUnique({ where: { id: existing.debtId } });
    if (!debt) throw new NotFoundException('Debt not found');

    const contract = await this.prisma.contract.findUnique({ where: { id: debt.contractId } });
    if (contract?.status === 'CANCELLED' || contract?.status === 'COMPLETED') {
      throw new BadRequestException("This contract is invalid.");
    }

    const partner = await this.prisma.partner.findUnique({ where: { id: existing.partnerId } });
    if (!partner) throw new NotFoundException("Partner not found");

    const type = dto.type ?? existing.type;

    if (type === 'OUT' && partner.role === 'CUSTOMER') {
      throw new BadRequestException("CUSTOMER bilan OUT to'lov bo'lmaydi");
    }

    if (type === 'IN' && partner.role === 'SELLER') {
      throw new BadRequestException("SELLER bilan IN to'lov bo'lmaydi");
    }

    const oldAmount = existing.amount ?? 0;
    const oldMonthsPaid = existing.monthsPaid ?? 0;

    const newAmount = dto.amount ?? oldAmount;
    const newMonthsPaid = dto.monthsPaid ?? oldMonthsPaid;

    const amountDiff = newAmount - oldAmount;
    const monthsPaidDiff = newMonthsPaid - oldMonthsPaid;

    const updated = await this.prisma.payment.update({
      where: { id },
      data: dto,
    });

    const updatedDebt = await this.prisma.debt.update({
      where: { id: debt.id },
      data: {
        total: debt.total - amountDiff,
        remainingMonths: debt.remainingMonths! - monthsPaidDiff,
      },
    });

    const newBalance =
      type === 'OUT'
        ? partner.balance - amountDiff
        : partner.balance + amountDiff;

    await this.prisma.partner.update({
      where: { id: partner.id },
      data: {
        balance: newBalance,
      },
    });

    if ((updatedDebt.total ?? 0) <= 0 && (updatedDebt.remainingMonths ?? 0) <= 0) {
      await this.prisma.contract.update({
        where: { id: debt.contractId },
        data: { status: "COMPLETED" },
      });
    }

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'payment',
        actionType: 'UPDATE',
        recordId: id,
        oldValue: existing,
        newValue: updated,
        userId,
        comment: 'Payment updated and debt adjusted',
      },
    });

    return { message: 'Payment updated successfully', updated };
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id);

    await this.prisma.payment.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'payment',
        actionType: 'DELETE',
        recordId: id,
        oldValue: existing,
        userId,
        comment: 'Payment deleted',
      },
    });

    return { message: 'Payment deleted successfully' };
  }
}
