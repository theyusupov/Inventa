import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateUserDto,
  loginDto,
  newPasswordDto,
  otps,
  RegisterDto,
  SendotpDto,
  verifyOtpDto,
} from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerateOtp } from 'src/shared/generateOtp';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as path from 'path';
import * as fs from 'fs/promises';
dotenv.config();

let otpVerifiedUsers: Record<string, boolean> = {};
let windowStore: { [key: string]: string } = {};

@Injectable()
export class UserService {
  constructor( private readonly prisma: PrismaService, private readonly Jwt: JwtService,){}

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  async sendOtp(data: SendotpDto): Promise<{ message: string }> {
    const { email } = data;
    const otp = GenerateOtp();
    windowStore[email] = otp;
    setTimeout(() => {
      delete windowStore[email];
    }, 10 * 60 * 1000);

    const options = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Your otp code',
      text: `Your OTP: ${otp}`,
    };

    try {
      await this.transporter.sendMail(options);
      const user = await this.prisma.user.create({
        data: {
          fullName: '',
          phoneNumber: '',
          password: '',
          image: '',
          isActive: false,
          balance: 0,
          role: 'STAFF',
          email,
        },
      });

      await this.prisma.actionHistory.create({
        data: {
          tableName: 'user',
          recordId: user.id,
          actionType: 'CREATE',
          comment: 'OTP sent to email for registration',
        },
      });

      return { message: 'Otp sent successfully' };
    } catch (error) {
      console.log({ error });
      throw error;
    }
  }

  async verifyOtp(data: verifyOtpDto) {
    const { otp, email } = data;
    const sentOtp = windowStore[email];

    if (otp === sentOtp) {
      delete windowStore[email];
      const updated = await this.prisma.user.update({
        where: { email },
        data: { isActive: true },
      });

      await this.prisma.actionHistory.create({
        data: {
          tableName: 'user',
          recordId: updated.id,
          actionType: 'CREATE',
          comment: 'OTP verified for registration',
        },
      });

      return { message: 'OTP verified successfully' };
    }

    return { message: 'Invalid OTP' };
  }

  async register(createUserDto: RegisterDto) {
    const isVerified = await this.prisma.user.findFirst({
      where: { email: createUserDto.email },
    });
    if (!isVerified) return { Error: 'This email is not verified yet' };

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.update({
      where: { email: createUserDto.email },
      data: {
        fullName: createUserDto.fullName,
        phoneNumber: createUserDto.phoneNumber,
        image: createUserDto.image,
        password: hashedPassword,
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: user.id,
        actionType: 'CREATE',
        userId: user.id,
        newValue: user,
        comment: 'User registered',
      },
    });

    return { message: 'Registered successfully' };
  }

  async login(data: loginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: data.email },
    });
    if (!user) return { Error: 'This email is not registered yet' };

    const isValid = bcrypt.compareSync(data.password, user.password);
    if (!isValid) return { Error: 'Wrong password!' };

    const token = this.Jwt.sign({ role: user.role, id: user.id });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: user.id,
        actionType: 'LOGIN',
        userId: user.id,
        comment: 'User logged in',
      },
    });

    return { token };
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateImage(id: string, image: Express.Multer.File) {
    const user = await this.prisma.user.findFirst({ where: { id } });
    if (!user || !user.image)
      throw new BadRequestException('User not found or no image');

    const filePath = path.join(__dirname, '../../userImage', user.image);
    try {
      await fs.unlink(filePath);
    } catch {}

    const updated = await this.prisma.user.update({
      where: { id },
      data: { image: image.filename },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: id,
        actionType: 'UPDATE',
        userId: id,
        oldValue: user,
        newValue: updated,
        comment: 'User image updated',
      },
    });

    return { message: 'Image updated successfully' };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if(!existing) throw new BadRequestException("Not found user")
    const updated = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: id,
        actionType: 'UPDATE',
        userId: id,
        oldValue: existing,
        newValue: updated,
        comment: 'User updated',
      },
    });

    return { message: 'User updated successfully' };
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Not found');

    const filePath = path.join(__dirname, '../../userImage', user.image);
    try {
      await fs.unlink(filePath);
    } catch {}

    await this.prisma.user.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: id,
        actionType: 'DELETE',
        userId: id,
        oldValue: user,
        comment: 'User deleted',
      },
    });

    return { message: 'User deleted successfully' };
  }

  async sendOtpToResetPassword(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const otp = GenerateOtp();
    const email = user.email;
    windowStore[email] = otp;

    setTimeout(() => {
      delete windowStore[email];
    }, 10 * 60 * 1000);

    await this.transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'Your OTP to reset password',
      text: `Verify this OTP to reset your password: ${otp}`,
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: user.id,
        actionType: 'RESET_PASSWORD',
        userId: user.id,
        comment: 'OTP sent for password reset',
      },
    });

    return { message: 'Check your email and verify OTP.' };
  }

  async verifyOtpToReset(data: otps, userId: string) {
    const { otp } = data;
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found!');

    const email = user.email;
    if (windowStore[email] === otp) {
      delete windowStore[email];
      otpVerifiedUsers[userId] = true;

      await this.prisma.actionHistory.create({
        data: {
          tableName: 'user',
          recordId: userId,
          actionType: "RESET_PASSWORD",
          userId,
          comment: 'OTP verified for password reset',
        },
      });

      return {
        message: 'OTP verified successfully, now you can reset your password!',
      };
    }

    return { error: 'Wrong OTP!' };
  }

  async resetPassword(data: newPasswordDto, userId: string) {
    const { newPassword } = data;
    if (!otpVerifiedUsers[userId])
      throw new BadRequestException(
        'You are not allowed to reset password without OTP verification!',
      );

    const hash = bcrypt.hashSync(newPassword, 10);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });
    delete otpVerifiedUsers[userId];

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: userId,
        actionType: 'RESET_PASSWORD',
        userId,
        comment: 'Password reset successfully',
      },
    });

    return { Success: 'Your password has been successfully changed!' };
  }
}
