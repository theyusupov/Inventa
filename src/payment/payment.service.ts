import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

//   async create(dto: CreatePaymentDto, userId: string) {
//     const { debtId, partnerId, type, amount, monthsPaid } = dto;

//     const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
//     if (!partner) throw new BadRequestException('Partner not found');

//     if (
//       (type === 'OUT' && partner.role === 'CUSTOMER') ||
//       (type === 'IN' && partner.role === 'SELLER') ||
//       (type === 'OUT' && debtId && monthsPaid)
//     ) {
//       throw new BadRequestException('Payment type does not match with partner role');
//     }

//     let payment;

//     if (debtId && monthsPaid) {
//       const debt = await this.prisma.debt.findUnique({ where: { id: debtId } });
//       if (!debt) throw new BadRequestException('Debt not found');

//       const contract = await this.prisma.contract.findUnique({ where: { id: debt.contractId } });
//       if (!contract || ['CANCELLED', 'COMPLETED'].includes(contract.status!)) {
//         throw new BadRequestException('This contract is invalid.');
//       }

//       if ((amount / monthsPaid) !== contract.monthlyPayment) {
//         throw new BadRequestException(
//           `The amount you entered is not sufficient to cover ${monthsPaid} months' payment.`
//         );
//       }

//       await this.prisma.debt.update({
//         where: { id: debtId },
//         data: {
//           total: debt.total - amount,
//           remainingMonths: (debt.remainingMonths ?? 0) - monthsPaid,
//         },
//       });

//       const updatedDebt = await this.prisma.debt.findUnique({ where: { id: debtId } });
//       if (updatedDebt && updatedDebt.remainingMonths === 0 && updatedDebt.total === 0) {
//         await this.prisma.contract.update({
//           where: { id: debt.contractId },
//           data: { status: 'COMPLETED' },
//         });
//       }
//     }

// payment = await this.prisma.payment.create({
//   data: debtId
//     ? {
//         amount,
//         comment: dto.comment,
//         paymentType: dto.paymentType,
//         type,
//         partnerId,
//         userId,
//         debtId:debtId
//       }
//     : {
//         amount,
//         comment: dto.comment,
//         paymentType: dto.paymentType,
//         type,
//         partnerId,
//         userId,
//       },
//   });

//     const balanceChange = type === 'OUT' ? -amount : amount;
//     await this.prisma.partner.update({
//       where: { id: partnerId },
//       data: { balance: partner.balance + balanceChange },
//     });

//     await this.prisma.actionHistory.create({
//       data: {
//         tableName: 'payment',
//         actionType: 'CREATE',
//         recordId: payment.id,
//         newValue: payment,
//         userId,
//         comment: 'Payment created and debt updated',
//       },
//     });

//     return {
//       message: 'Payment created successfully',
//       payment,
//     };
//   }

  async findAll(params: {
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const { search, sortBy = 'createdAt', order = 'asc', page = 1, limit = 10 } = params;

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
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: Number(limit),
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
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        partner: true,
        debt: true,
        user: true,
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto, userId: string) {
    const existing = await this.prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payment not found');

    const debt = await this.prisma.debt.findUnique({ where: { id: existing.debtId } });
    if (!debt) throw new NotFoundException('Debt not found');

    const contract = await this.prisma.contract.findUnique({ where: { id: debt.contractId } });
    if (!contract || ['CANCELLED', 'COMPLETED'].includes(contract.status!)) {
      throw new BadRequestException('This contract is invalid.');
    }

    const partner = await this.prisma.partner.findUnique({ where: { id: existing.partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');

    const type = dto.type ?? existing.type;
    if ((type === 'OUT' && partner.role === 'CUSTOMER') || (type === 'IN' && partner.role === 'SELLER')) {
      throw new BadRequestException('Payment type does not match partner role');
    }

    const oldAmount = existing.amount ?? 0;
    const newAmount = dto.amount ?? oldAmount;
    const amountDiff = newAmount - oldAmount;

    const oldMonthsPaid = existing.monthsPaid ?? 0;
    const newMonthsPaid = dto.monthsPaid ?? oldMonthsPaid;
    const monthsPaidDiff = newMonthsPaid - oldMonthsPaid;

    const updated = await this.prisma.payment.update({ where: { id }, data: dto });

    const updatedDebt = await this.prisma.debt.update({
      where: { id: debt.id },
      data: {
        total: debt.total - amountDiff,
        remainingMonths: (debt.remainingMonths ?? 0) - monthsPaidDiff,
      },
    });

    const balanceChange = type === 'OUT' ? -amountDiff : amountDiff;
    await this.prisma.partner.update({
      where: { id: partner.id },
      data: { balance: partner.balance + balanceChange },
    });

    if ((updatedDebt.total ?? 0) <= 0 && (updatedDebt.remainingMonths ?? 0) <= 0) {
      await this.prisma.contract.update({ where: { id: debt.contractId }, data: { status: 'COMPLETED' } });
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