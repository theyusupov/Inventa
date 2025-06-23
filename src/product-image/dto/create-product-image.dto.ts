import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductImageDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'a1b2c3d4-5678-90ef-ghij-klmnopqrstuv',
    description: 'Product ID related to the image',
  })
  productId: string;
}
