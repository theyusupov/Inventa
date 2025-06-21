import { IsString, IsInt } from 'class-validator';

export class CreateContractDto {
  @IsInt()
  quantity: number;

  @IsInt()
  sellPrice: number;

  @IsInt()
  repaymentPeriod: number; 

  @IsString()
  productId: string;

  @IsString()
  partnerId: string;
}
