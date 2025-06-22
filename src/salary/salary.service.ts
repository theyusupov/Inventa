import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  async create(createSalaryDto: CreateSalaryDto) {
    const salary = await this.prisma.salary.create({
      data: createSalaryDto,
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

  async update(id: string, updateSalaryDto: UpdateSalaryDto) {
    const exists = await this.prisma.salary.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Salary not found');

    const updated = await this.prisma.salary.update({
      where: { id },
      data: {
        ...updateSalaryDto,
        updatedAt: new Date(),
      },
    });
    return { message: 'Salary updated successfully' };
  }

  async remove(id: string) {
    await this.prisma.salary.delete({ where: { id } });
    return { message: 'Salary deleted successfully' };
  }
}
