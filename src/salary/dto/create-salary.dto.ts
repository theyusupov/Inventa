import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateSalaryDto {
  @IsInt()
  amount: number;

  @IsString()
  comment: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
