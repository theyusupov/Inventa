import { IsInt, IsString, IsEnum } from 'class-validator';
import { PaymentType, Type } from 'generated/prisma';

export class CreatePaymentDto {
  @IsInt()
  amount: number;

  @IsString()
  comment: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsEnum(Type)
  type: Type;

  @IsString()
  partnerId: string;

  @IsString()
  debtId: string;
}
