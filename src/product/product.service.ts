import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from 'generated/prisma';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const category = await this.prisma.category.findUnique({ where: { id: createProductDto.categoryId } });
    if (!category) throw new BadRequestException('Category not found');

    if (createProductDto.partnerId) {
      var partner = await this.prisma.partner.findUnique({where: { id: createProductDto.partnerId }});
      if (!partner)  throw new BadRequestException('Partner not found')
      if (partner?.role!=='SELLER')  throw new BadRequestException('Role of the partner is cutomer')

      }
      const oldBalance = partner!.balance;


    const newSellPrice = createProductDto.sellPrice ?? createProductDto.buyPrice + ((30 * createProductDto.buyPrice) / 100)



    const product = await this.prisma.product.create({
      data: {
        name:createProductDto.name,
        buyPrice:createProductDto.buyPrice,
        unit:createProductDto.unit,
        description:createProductDto.description,
        image:createProductDto.image,
        comment:createProductDto.comment,
        categoryId: createProductDto.categoryId,
        sellPrice: newSellPrice,
        quantity: createProductDto.quantity ? createProductDto.quantity : 0,
        isActive: (createProductDto.quantity&& createProductDto.quantity > 0) ? true : false,
        userId,
      },
    });

    if(createProductDto.quantity>0){
      const buy = await this.prisma.purchase.create({
        data: {
          quantity: createProductDto.quantity,
          buyPrice: createProductDto.buyPrice,
          comment: createProductDto.comment,
          userId: userId,
          partnerId: createProductDto.partnerId??null,
          productId: product.id,
        },
      });

      await this.prisma.partner.update({where:{id:buy.partnerId},data:{balance: oldBalance+buy.quantity*buy.buyPrice}})
    }





    await this.prisma.actionHistory.create({
      data: {
        tableName: 'product',
        recordId: product.id,
        actionType: 'CREATE',
        newValue: product,
        userId,
        comment: 'Product created',
      },
    });

    return { message: 'Product created successfully', product };
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

    const where: Prisma.ProductWhereInput = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {};

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.product.count({ where });

    return {
      data: products,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        user: true
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const oldProduct = await this.prisma.product.findUnique({ where: { id } });
    if (!oldProduct) throw new NotFoundException('Product not found');

    const requestUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!requestUser) throw new NotFoundException('Requesting user not found');

    const isCreator = oldProduct.userId === userId;
    const isOwner = requestUser.role === 'OWNER';

    if (!isCreator && !isOwner) {
      throw new ForbiddenException('You can update only products which you created or if you are owner');
    }

    let imageFileName = oldProduct.image;

    if (dto.image && dto.image !== oldProduct.image) {
      const filePath = path.join(__dirname, '../../images', oldProduct.image);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('Eski product rasmi o‘chmadi:', err.message);
      }

      imageFileName = dto.image;
    }

  let newIsActive;

  if (dto.quantity !== undefined) {
    newIsActive = dto.quantity > 0;
  } else {
    newIsActive = oldProduct.isActive; 
  }

  const updatedProduct = await this.prisma.product.update({
    where: { id },
    data: {
      ...dto,
      image: imageFileName,
      isActive: newIsActive,
    },
  });

    await this.prisma.actionHistory.create({
      data: {
        tableName: 'product',
        recordId: id,
        actionType: 'UPDATE',
        oldValue: oldProduct,
        newValue: updatedProduct,
        comment: 'Product updated',
        userId,
      },
    });

    return {
      message: 'Product updated successfully',
      product: updatedProduct,
    };
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');


    await this.prisma.purchase.deleteMany({ where: { productId: id } });
    await this.prisma.contract.deleteMany({ where: { productId: id } });

    if (existing.image) {
      const filePath = path.join(__dirname, '../../images', existing.image);
      try {
        await fs.unlink(filePath);
    } catch {}
    }


    await this.prisma.product.delete({ where: { id } });
    await this.prisma.actionHistory.create({
      data: {
        tableName: 'product',
        recordId: id,
        actionType: 'DELETE',
        oldValue: existing,
        userId,
        comment: 'Product deleted',
      },
    });

    return { message: 'Product deleted successfully' };
  }

  async exportToExcel(res: Response) {
    const products = await this.prisma.product.findMany({
      include: {
        user: true,
        category: true,
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.addRow([
      '№',
      'Product ID',
      'Name',
      'Sell Price',
      'Buy Price',
      'Quantity',
      'Unit',
      'Is Active',
      'Description',
      'Comment',
      'Image',
      'Category',
      'Created By (User)',
      'Created At',
      'Updated At',
    ]);

    products.forEach((product, index) => {
      worksheet.addRow([
        index + 1,
        product.id,
        product.name,
        product.sellPrice,
        product.buyPrice,
        product.quantity,
        product.unit,
        product.isActive ? 'Yes' : 'No',
        product.description,
        product.comment,
        product.image,
        product.category?.name || '—',
        product.user?.fullName || '—',
        product.createdAt?.toISOString().split('T')[0] || '',
        product.updatedAt?.toISOString().split('T')[0] || '',
      ]);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }
}
