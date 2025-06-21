import { IsInt, IsString } from 'class-validator';

export class CreateDebtDto {
  @IsInt()
  total: number;

  @IsInt()
  repaymentPeriod: number;

  @IsString()
  contractId: string;
}
