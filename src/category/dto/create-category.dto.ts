import { IsString, IsNotEmpty, IsNumber, IsInt } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  repaymentPeriod: number;

  @IsString()
  @IsNotEmpty()
  image: string;
}
