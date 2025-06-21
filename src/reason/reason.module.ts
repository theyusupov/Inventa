import { Module } from '@nestjs/common';
import { ReasonService } from './reason.service';
import { ReasonController } from './reason.controller';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
import { PrismaModule } from 'src/prisma/prisma.module';
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret:process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [ReasonController],
  providers: [ReasonService],
})
export class ReasonModule {}
