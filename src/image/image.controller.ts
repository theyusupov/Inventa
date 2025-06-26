import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ImageService } from './image.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerUploadUserImage } from 'src/shared/multer';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';

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
