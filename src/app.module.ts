import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { PartnerModule } from './partner/partner.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [PrismaModule, UserModule, PartnerModule, CategoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
