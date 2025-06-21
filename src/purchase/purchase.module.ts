import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
import { PrismaModule } from 'src/prisma/prisma.module';
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret:process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [PurchaseController],
  providers: [PurchaseService],
})
export class PurchaseModule {}
