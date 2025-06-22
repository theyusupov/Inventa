import { Module } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
import { PrismaModule } from 'src/prisma/prisma.module';
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret:process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [SalaryController],
  providers: [SalaryService],
})
export class SalaryModule {}
