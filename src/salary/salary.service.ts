import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  async create(createSalaryDto: CreateSalaryDto, userId: string) {
    const salary = await this.prisma.salary.create({
      data: createSalaryDto,
    });
    await this.prisma.user.update({where:{id:salary.userId||undefined},data:{balance:salary.amount}});

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'salary',
        recordId: salary.id,
        actionType: 'CREATE',
        userId,
        newValue: salary,
        comment: 'Salary created',
      },
    });

    return { message: 'Salary created successfully' };
  }

  async findAll() {
    return this.prisma.salary.findMany({ include: { user: true } });
  }

  async findOne(id: string) {
    const salary = await this.prisma.salary.findUnique({ where: { id } });
    if (!salary) throw new NotFoundException('Salary not found');
    return salary;
  }

  async update(id: string, updateSalaryDto: UpdateSalaryDto, userId: string) {
    const exists = await this.prisma.salary.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Salary not found');

    const updated = await this.prisma.salary.update({
      where: { id },
      data: {
        ...updateSalaryDto,
        updatedAt: new Date(),
      },
    });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'salary',
        recordId: updated.id,
        actionType: 'UPDATE',
        userId,
        oldValue: exists,
        newValue: updated,
        comment: 'Salary updated',
      },
    });

    return { message: 'Salary updated successfully' };
  }

  async remove(id: string, userId: string) {
    const salary = await this.prisma.salary.findUnique({ where: { id } });
    if (!salary) throw new NotFoundException('Salary not found');

    await this.prisma.salary.delete({ where: { id } });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'salary',
        recordId: id,
        actionType: 'DELETE',
        userId,
        oldValue: salary,
        comment: 'Salary deleted',
      },
    });

    return { message: 'Salary deleted successfully' };
  }
}
