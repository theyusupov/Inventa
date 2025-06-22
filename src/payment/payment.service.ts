import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, userId: string) {
    let debt = await this.prisma.debt.findFirst({where:{id:dto.debtId}})
    if(!debt) throw new BadRequestException("Debt not found")
    const payment = await this.prisma.payment.create({
      data: { ...dto, userId },
    });
    const newTotal = debt.total-payment.amount
    await this.prisma.debt.update({where:{id:payment.debtId}, data:{total:newTotal}});
    return { message: 'Payment created successfully'};
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        partner: true,
        debt: true,
        user: true,
      },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const existing = await this.prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payment not found');

    const updated = await this.prisma.payment.update({
      where: { id },
      data: dto,
    });

    return { message: 'Payment updated successfully'};
  }

  async remove(id: string) {
    await this.findOne(id); 
    await this.prisma.payment.delete({ where: { id } });
    return { message: 'Payment deleted successfully' };
  }
}
