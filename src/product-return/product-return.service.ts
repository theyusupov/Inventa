import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductReturnDto } from './dto/create-product-return.dto';
import { UpdateProductReturnDto } from './dto/update-product-return.dto';

@Injectable()
export class ProductReturnService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductReturnDto, userId:string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: dto.contractId } });
    if (!contract) throw new BadRequestException('Contract not found');

    var product = await this.prisma.product.findFirst({where:{id:contract.productId}})
    if(!product) throw new BadRequestException("Went wrong!")

    const reason = await this.prisma.reason.findUnique({ where: { id: dto.reasonId } });
    if (!reason) throw new BadRequestException('Reason not found');

    if(!dto.isNew===true){ 
      await this.prisma.productActionHistory.create({
      data: {
        productId: product.id,
        actionType: 'TRIED TO RETURN',
        sourceTable: 'product-return',
        recordId: product.id,
        oldValue: product,
        newValue: product,
        comment: 'Product not returned',
        userId,
      },
    });
      throw new BadRequestException("Sorry, we cannot accept used products!")}


      const productReturn = await this.prisma.productReturn.create({
        data: dto,
      });

      await this.prisma.productActionHistory.create({
      data: {
        productId: product.id,
        actionType: 'RETURN',
        sourceTable: 'product-return',
        recordId: product.id,
        oldValue: product,
        newValue: product,
        comment: 'Product returned',
        userId,
      },
    })
    return { message: 'Product return recorded successfully' };
  }

  async findAll() {
    return this.prisma.productReturn.findMany({
      include: {
        contract: true,
        reason: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.productReturn.findUnique({
      where: { id },
      include: {
        contract: true,
        reason: true,
      },
    });
  }

  async update(id: string, dto: UpdateProductReturnDto) {
    const existing = await this.prisma.productReturn.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Product return not found');

    const updated = await this.prisma.productReturn.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    return { message: 'Product return updated successfully' };
  }

  async remove(id: string) {
    await this.prisma.productReturn.delete({ where: { id } });
    return { message: 'Product return deleted successfully' };
  }
}
