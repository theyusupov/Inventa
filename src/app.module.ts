import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { PartnerModule } from './partner/partner.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { ProductImageModule } from './product-image/product-image.module';
import { PurchaseModule } from './purchase/purchase.module';
import { ContractModule } from './contract/contract.module';
import { DebtModule } from './debt/debt.module';
import { ReasonModule } from './reason/reason.module';
import { ProductReturnModule } from './product-return/product-return.module';
import { PaymentModule } from './payment/payment.module';
import { SalaryModule } from './salary/salary.module';

@Module({
  imports: [PrismaModule, UserModule, PartnerModule, CategoryModule, ProductModule, ProductImageModule, PurchaseModule, ContractModule, DebtModule, ReasonModule, ProductReturnModule, PaymentModule, SalaryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
