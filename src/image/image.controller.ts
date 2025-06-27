import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { ImageService } from './image.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerUploadUserImage } from 'src/shared/multer';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

    @Post('/upload-image')
    @ApiOperation({ summary: 'Upload  image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          image: {
            type: 'string',
            format: 'binary'
          }
        }
      }
    })
    @UseInterceptors(FileInterceptor('image', { storage: multerUploadUserImage }))
    uploadImage(@UploadedFile() image: Express.Multer.File) {
      if (!image) return 'Not image uploaded';
      return { image: image.filename };
    }

    @UseGuards(JwtAuthGuard, JwtRoleGuard)
    @Roles([UserRole.STAFF, UserRole.OWNER])
    @Get('get-images')
    @ApiOperation({ summary: 'Get images' })
    getImage() {
      const directoryPath = path.join(__dirname, '../../images');

      const files = fs.readdirSync(directoryPath);
      const fileUrls = files.map((file) => ({
        filename: file,
        url: file,
      }));

      return fileUrls;
    }

}
