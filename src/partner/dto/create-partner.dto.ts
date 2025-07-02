import { IsString, IsNotEmpty, IsBoolean, IsInt, IsEnum, IsArray } from 'class-validator';
import { PartnerRole, Region } from 'generated/prisma';


export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsArray()
  @IsString()
  @IsNotEmpty()
  phoneNumbers: string[];

  @IsEnum(Region)
  @IsNotEmpty()
  address: Region;

  @IsBoolean()
  isActive: boolean;

  @IsInt()
  balance: number;

  @IsEnum(PartnerRole)
  role: PartnerRole;
}
