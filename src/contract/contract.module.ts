import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
import { PrismaModule } from 'src/prisma/prisma.module';
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret:process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [ContractController],
  providers: [ContractService],
})
export class ContractModule {}
