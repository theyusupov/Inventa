import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { PartnerModule } from './partner/partner.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { ProductImageModule } from './product-image/product-image.module';
import { ProductActionHistoryModule } from './product-action-history/product-action-history.module';
import { PurchaseModule } from './purchase/purchase.module';

@Module({
  imports: [PrismaModule, UserModule, PartnerModule, CategoryModule, ProductModule, ProductImageModule, ProductActionHistoryModule, PurchaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
