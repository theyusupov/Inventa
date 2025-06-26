import { Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Prisma } from 'generated/prisma';

@Injectable()
export class ImageService {
    constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  
    async updateImage(id: string, image: Express.Multer.File) {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user || !user.image) throw new BadRequestException('User not found or image missing');
  
      const filePath = path.join(__dirname, '../../images', user.image);
      try {
        await fs.unlink(filePath);
      } catch {}
  
      const updated = await this.prisma.user.update({
        where: { id },
        data: { image: image.filename },
      });
  
      await this.prisma.actionHistory.create({
        data: {
          tableName: 'image',
          recordId: id,
          actionType: 'UPDATE',
          userId: id,
          oldValue: user,
          newValue: updated,
          comment: 'Image updated',
        },
      });
  
      return { message: 'Image updated successfully', updated };
    }
}
