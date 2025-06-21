import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProductImageDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}
