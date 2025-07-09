// import { IsString, IsInt, IsEnum } from 'class-validator';
// import { ContractStatus } from 'generated/prisma';

// export class CreateContractDto {
//   @IsInt()
//   quantity: number;

//   @IsInt()
//   sellPrice?: number;

//   @IsInt()
//   repaymentPeriod?: number; 

//   @IsString()
//   productId: string;

//   @IsString()
//   partnerId: string;

//   @IsEnum(ContractStatus)
//   status? : ContractStatus
// }

import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested, Min } from "class-validator";
import { Type } from "class-transformer";

export class ProductDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(0)
  sellPrice: number;
}

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @IsInt()
  @Min(1)
  repaymentPeriod: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products: ProductDto[];
}

