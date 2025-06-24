import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, loginDto, newPasswordDto, otps, RegisterDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { multerUploadUserImage } from 'src/shared/multer';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/upload-image')
  @ApiOperation({ summary: 'Upload user image' })
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

  @Patch('/update-image/:id')
  @ApiOperation({ summary: 'Update user image by ID' })
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
  updateImage(@Param('id') id: string, @UploadedFile() image: Express.Multer.File) {
    if (!image) return 'Not image uploaded';
    return this.userService.updateImage(id, image);
  }

  @Post('/create-user')
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({
    schema: {
      example: {
        fullName: 'Ruzimuhammad Yusupov',
        phoneNumber: '+998-90-123-45-67',
        email: 'yusupovruzimuhammad4@gmail.com',
        password: '123456',
        image: 'image.jpg',
        IsActive: true,
        balance: 0,
        role: 'STAFF'
      }
    }
  })
  register(@Body() createUserDto: RegisterDto) {
    return this.userService.createUser(createUserDto);
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({
    schema: {
      example: {
        email: 'yusupovruzimuhammad4@gmail.com',
        password: '123456'
      }
    }
  })
  login(@Body() data: loginDto) {
    return this.userService.login(data);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @Get()
  findAll() {
    return this.userService.findAll();
  }


  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ schema: { example: { newPassword: 'newpass123' } } })
  @Patch('reset-password')
  resetPassword(@Request() req, @Body() data: newPasswordDto) {
    const userId = req.user.id;
    return this.userService.resetPassword(data, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user by ID' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send OTP to reset password' })
  @Post('/send-otp-reset')
  sendResetOtp(@Request() req) {
    const userId = req.user.id;
    return this.userService.sendOtpToResetPassword(userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify OTP to reset password' })
  @ApiBody({ schema: { example: { otp: '123456' } } })
  @Post('/verify-otp-reset')
  verifyResetOtp(@Request() req, @Body() body: otps) {
    const userId = req.user.id;
    return this.userService.verifyOtpToReset(body, userId);
  }


}
