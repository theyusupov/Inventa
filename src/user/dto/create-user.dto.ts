import { IsString, IsNotEmpty, IsEmail, IsBoolean, IsInt, IsEnum, IsOptional } from 'class-validator';
import { UserRole} from 'generated/prisma';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  isActive: boolean;

  @IsInt()
  balance: number;

  @IsEnum(UserRole)
  role?: UserRole;
}




  export class loginDto{
    @IsEmail()
    @IsString()
    email: string;

    @IsString()
    password: string;
  }

  export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  image: string; 

  @IsBoolean()
  IsActive : boolean

  @IsInt()
  balance:number

  @IsEnum(UserRole)
  role:UserRole
}

export class otps {
  @IsString()
  otp:string
}

export class newPasswordDto{
  @IsNotEmpty()
  newPassword: string;
}
  