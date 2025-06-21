import { Module } from '@nestjs/common';
import { ProductImageService } from './product-image.service';
import { ProductImageController } from './product-image.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret:process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [ProductImageController],
  providers: [ProductImageService],
})
export class ProductImageModule {}
