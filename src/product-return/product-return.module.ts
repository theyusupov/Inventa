import { Module } from '@nestjs/common';
import { ProductReturnService } from './product-return.service';
import { ProductReturnController } from './product-return.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret:process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [ProductReturnController],
  providers: [ProductReturnService],
})
export class ProductReturnModule {}
