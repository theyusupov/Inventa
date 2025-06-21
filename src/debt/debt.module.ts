import { Module } from '@nestjs/common';
import { DebtService } from './debt.service';
import { DebtController } from './debt.controller';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
import { PrismaModule } from 'src/prisma/prisma.module';
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret:process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [DebtController],
  providers: [DebtService],
})
export class DebtModule {}
