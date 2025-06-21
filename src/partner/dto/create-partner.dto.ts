import { IsString, IsNotEmpty, IsBoolean, IsInt, IsEnum } from 'class-validator';
import { PartnerRole } from 'generated/prisma';


export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsBoolean()
  isActive: boolean;

  @IsInt()
  balance: number;

  @IsEnum(PartnerRole)
  role: PartnerRole;
}
