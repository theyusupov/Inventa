import { Injectable } from '@nestjs/common';
import { CreateProductActionHistoryDto } from './dto/create-product-action-history.dto';
import { UpdateProductActionHistoryDto } from './dto/update-product-action-history.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductActionHistoryService {
  constructor(readonly prisma:PrismaService){}
  async findAll() {
    return await this.prisma.productActionHistory.findMany();
  }

  async remove(id: string) {
    return await this.prisma.productActionHistory.delete({where:{id}});
  }
}
