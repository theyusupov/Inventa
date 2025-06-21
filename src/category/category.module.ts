import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret:process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
