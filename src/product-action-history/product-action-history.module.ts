import { Module } from '@nestjs/common';
import { ProductActionHistoryService } from './product-action-history.service';
import { ProductActionHistoryController } from './product-action-history.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret: process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [ProductActionHistoryController],
  providers: [ProductActionHistoryService],
})
export class ProductActionHistoryModule {}
