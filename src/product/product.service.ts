import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const category = await this.prisma.category.findUnique({ where: { id: createProductDto.categoryId } });
    if (!category) throw new BadRequestException('Category not found');

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        userId,
      },
    });

    await this.prisma.productActionHistory.create({
      data: {
        productId: product.id,
        actionType: 'CREATE',
        sourceTable: 'product',
        recordId: product.id,
        newValue: product,
        comment: 'Product created',
        userId,
      },
    });

    return { message: 'Product created successfully' };
  }

  async findAll() {
    return await this.prisma.product.findMany();
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, user: true, productImages:true},
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId:string) {
    const oldProduct = await this.prisma.product.findUnique({ where: { id } });

    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });

    await this.prisma.productActionHistory.create({
      data: {
        productId: product.id,
        actionType: "UPDATE",
        sourceTable: "product",
        recordId: product.id,
        oldValue: {oldProduct},          
        newValue: product,             
        comment: "Product updated",
              
      },
    });

    return { message: 'Product updated successfully' };
  }

  async remove(id: string, userId:string) {
    let oldData = await this.prisma.product.findUnique({where:{id}})
    if(!oldData) throw new BadRequestException("Not found")
    await this.prisma.product.delete({ where: { id:oldData.id } });
    await this.prisma.productActionHistory.create({
      data: {
        productId: oldData.id,
        actionType: "DELETE",
        sourceTable: "product",
        recordId: oldData.id,
        oldValue: oldData,                      
        comment: "Product delete",
        userId
              
      },
    });
       return { message: 'Product deleted successfully' };
  }
}
