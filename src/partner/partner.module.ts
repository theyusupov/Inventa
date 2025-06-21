import { Module } from '@nestjs/common';
import { PartnerService } from './partner.service';
import { PartnerController } from './partner.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv'
dotenv.config()

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret:process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [PartnerController],
  providers: [PartnerService],

})
export class PartnerModule {}
