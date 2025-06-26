import { IsString, IsInt, IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { Units } from 'generated/prisma';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  sellPrice: number;

  @IsInt()
  buyPrice: number;

  @IsEnum(Units)
  unit: Units;

  @IsBoolean()
  isActive: boolean;

  @IsString()
  description: string;

  @IsString()
  image: string;

  @IsString()
  comment: string;

  @IsString()
  categoryId: string;
}
