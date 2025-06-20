import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[PrismaModule, JwtModule.register({global:true, secret: process.env.SECRETKEY, signOptions:{expiresIn:"1h"}})],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
 