import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Prisma } from 'generated/prisma';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, userId: string) {
    const { debtId, partnerId, type, amount } = dto;

    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new BadRequestException('Partner not found');

    if (
      (type === 'OUT' && partner.role === 'CUSTOMER') ||
      (type === 'IN' && partner.role === 'SELLER') 
    ) {
      throw new BadRequestException('Payment type does not match with partner role');
    }

    let payment;

    if (debtId) {
      if (partner.role !== 'CUSTOMER') {
        throw new BadRequestException("In a seller role, payment for a contract is not allowed.");
      }

      const debt = await this.prisma.debt.findUnique({ where: { id: debtId } });
      if (!debt) throw new BadRequestException('Debt not found');

      const contract = await this.prisma.contract.findUnique({ where: { id: debt.contractId } });
      if (!contract || ['CANCELLED', 'COMPLETED'].includes(contract.status!)) {
        throw new BadRequestException('This contract is invalid.');
      }

      const monthlyPayment = Number(contract.monthlyPayment);
      const calculatedMonths = amount / monthlyPayment;

      if (!Number.isInteger(calculatedMonths)) {
        throw new BadRequestException(
          `The amount must be divisible by monthly payment. Expected exact multiple of ${monthlyPayment}.`
        );
      }

      await this.prisma.debt.update({
        where: { id: debtId },
        data: {
          total: debt.total - amount,
          remainingMonths: (debt.remainingMonths ?? 0) - calculatedMonths,
        },
      });

      const updatedDebt = await this.prisma.debt.findUnique({ where: { id: debtId } });
      if (updatedDebt && updatedDebt.remainingMonths === 0 && updatedDebt.total === 0) {
        await this.prisma.contract.update({
          where: { id: debt.contractId },
          data: { status: 'COMPLETED' },
        });
      }

      payment = await this.prisma.payment.create({
        data: {
          amount,
          comment: dto.comment,
          paymentType: dto.paymentType,
          type,
          partnerId,
          userId,
          debtId,
          monthsPaid: calculatedMonths,
        },
      });

      await this.prisma.partner.update({
        where: { id: partnerId },
        data: { balance: partner.balance + amount },
      });

    } else {
      if (partner.role !== 'SELLER') {
        throw new BadRequestException("Customers are not allowed to make payments without a debtId.");
      }

      payment = await this.prisma.payment.create({
        data: {
          amount,
          comment: dto.comment,
          paymentType: dto.paymentType,
          type,
          partnerId,
          userId,
        },
      });

      await this.prisma.partner.update({
        where: { id: partnerId },
        data: { balance: partner.balance - amount },
      });
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

    return {
      message: 'Payment created successfully',
      payment,
    };
  }

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

async exportToExcel(res: Response) {
  const payments = await this.prisma.payment.findMany({
    include: {
      partner: true,
      user: true,
      debt: {
        include: {
          contract: {
            include: {
              product: true,
              partner: true,
            },
          },
        },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Payments');

  worksheet.addRow([
    '№',
    'Payment ID',
    'Partner Name',
    'Partner Role',
    'Amount',
    'Comment',
    'Months Paid',
    'Payment Type',
    'Type',
    'Debt ID',
    'Contract Product',
    'Contract Partner',
    'User',
    'Created At',
  ]);

  payments.forEach((payment, index) => {
    worksheet.addRow([
      index + 1,
      payment.id,
      payment.partner?.fullName || '—',
      payment.partner?.role || '—',
      payment.amount,
      payment.comment,
      payment.monthsPaid ?? '—',
      payment.paymentType,
      payment.type,
      payment.debtId ?? '—',
      payment.debt?.contract?.product?.name || '—',
      payment.debt?.contract?.partner?.fullName || '—',
      payment.user?.fullName || '—',
      payment.createdAt?.toISOString().split('T')[0],
    ]);
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');

  await workbook.xlsx.write(res);
  res.end();
}
}
