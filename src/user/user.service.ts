import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto, loginDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Prisma } from 'generated/prisma';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';


@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(dto: RegisterDto) {
    const [emailExists, phoneExists] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findFirst({ where: { phoneNumbers: {hasSome: dto.phoneNumbers }} }),
    ]);

    if (emailExists) throw new ConflictException('Email already in use');
    if (phoneExists) throw new ConflictException('Phone number already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phoneNumbers: dto.phoneNumbers,
        image: dto.image,
        password: hashedPassword,
        email: dto.email,
        isActive: dto.IsActive,
        balance: dto.balance,
        role: dto.role,
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: user.id,
        actionType: 'CREATE',
        userId: user.id,
        newValue: user,
        comment: 'User created',
      },
    });

    return {
      message: 'Created successfully',
      data: {
        fullName: user.fullName,
        phoneNumbers: user.phoneNumbers,
        image: user.image,
        email: user.email,
        balance: user.balance,
      },
    };
  }

  async login(dto: loginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('Email is not registered');

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new BadRequestException('Incorrect password');

    const access_token = this.jwtService.sign({ id: user.id, role: user.role });
    const refresh_token = this.jwtService.sign({ id: user.id, role: user.role });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: user.id,
        actionType: 'LOGIN',
        userId: user.id,
        comment: 'User logged in',
      },
    });

    return { access_token, refresh_token };
  }

  async findAll(params: {
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      sortBy = 'createdAt',
      order = 'asc',
      page = 1,
      limit = 10,
    } = params;

    const where: Prisma.UserWhereInput = search
      ? {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {};

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: Number(limit),
    });

    const total = await this.prisma.user.count({ where });

    return {
      data: users,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id:userId },
      include: {
        partners:true,
        products:true,
        purchases:true,
        contracts:true,
        payments:true,
        salaries:true
        
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.phoneNumbers && dto.phoneNumbers.some(phone => user.phoneNumbers.includes(phone))) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phoneNumbers: {hasSome: dto.phoneNumbers }},
      });
      if (existingPhone) throw new ConflictException('Phone number already in use');
    }

    if (dto.image && user.image && dto.image !== user.image) {
      const filePath = path.join(__dirname, '../../images', user.image);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('Old image could not be deleted:', err.message);
      }
    }

    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : user.password;


    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        password: hashedPassword
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'user',
        recordId: id,
        actionType: 'UPDATE',
        userId: id,
        oldValue: user,
        newValue: updated,
        comment: 'User updated',
      },
    });

    return {
      message: 'User updated successfully',
      data: {
        fullName: updated.fullName,
        phoneNumber: updated.phoneNumbers,
        image: updated.image,
        email: updated.email,
        balance: updated.balance,
      },
    };
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.image) {
      const filePath = path.join(__dirname, '../../images', user.image);
      try {
        await fs.unlink(filePath);
      } catch {}
    }

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

 async exportToExcel(res: Response) {
    const users = await this.prisma.user.findMany({
      include: {
        partners: true,
        products: true,
        contracts: true,
        payments: true,
        salaries: true,
      },
    });

    if (!users.length) throw new NotFoundException('No users found');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.addRow([
      '№',
      'Full Name',
      'Phone Number',
      'Email',
      'Balance',
      'Role',
      'Active',
      'Image',
      'Created At',
      'Updated At',
      'Products',
      'Contracts',
      'Payments',
      'Salaries',
    ]);

    users.forEach((user, index) => {
      worksheet.addRow([
        index + 1,
        user.fullName,
        user.phoneNumbers,
        user.email,
        user.balance,
        user.role,
        user.isActive ? 'Yes' : 'No',
        user.image,
        user.createdAt?.toISOString().split('T')[0] || '',
        user.updatedAt?.toISOString().split('T')[0] || '',
        user.products.length,
        user.contracts.length,
        user.payments.length,
        user.salaries.length,
      ]);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }
}
