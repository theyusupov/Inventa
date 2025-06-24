import { IsString, IsInt, IsEnum } from 'class-validator';
import { ContractStatus } from 'generated/prisma';

export class CreateContractDto {
  @IsInt()
  quantity: number;

  @IsInt()
  sellPrice?: number;

  @IsInt()
  buyPrice?: number;

  @IsInt()
  repaymentPeriod: number; 

  @IsString()
  productId: string;

  @IsString()
  partnerId: string;

  @IsEnum(ContractStatus)
  status? : ContractStatus
}
