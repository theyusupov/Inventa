import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsBoolean, IsInt, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { PartnerRole, Region } from 'generated/prisma';

class LatLng {
  @IsString()
  lat: string;

  @IsString()
  lng: string;
}

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LatLng)
  location: LatLng[];

  @IsBoolean()
  isActive: boolean;

  @IsInt()
  balance: number;

  @IsEnum(PartnerRole)
  role: PartnerRole;
}
