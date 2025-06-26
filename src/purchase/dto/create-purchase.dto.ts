import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreatePurchaseDto {
  @IsInt()
  quantity?: number;

  @IsInt()
  buyPrice?: number;

  @IsString()
  comment: string;

  @IsString()
  partnerId: string;

  @IsString()
  productId: string;
}
