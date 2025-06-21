import { Injectable } from '@nestjs/common';
import { CreateProductActionHistoryDto } from './dto/create-product-action-history.dto';
import { UpdateProductActionHistoryDto } from './dto/update-product-action-history.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductActionHistoryService {
  constructor(readonly prisma:PrismaService){}
  create(createProductActionHistoryDto: CreateProductActionHistoryDto) {
    return 'This action adds a new productActionHistory';
  }

  findAll() {
    return this.prisma.productActionHistory.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} productActionHistory`;
  }

  update(id: number, updateProductActionHistoryDto: UpdateProductActionHistoryDto) {
    return `This action updates a #${id} productActionHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} productActionHistory`;
  }
}
