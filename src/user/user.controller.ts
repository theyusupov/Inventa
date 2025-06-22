import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, loginDto, newPasswordDto, otps, RegisterDto, SendotpDto, verifyOtpDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { multerUploadUserImage } from 'src/shared/multer';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("/send-otp")
  sendOtp(@Body() email:SendotpDto){
    return this.userService.sendOtp(email)
  }

  @Post("/verify-otp")
  verifyOtp(@Body() data:verifyOtpDto){
    return this.userService.verifyOtp(data)
  }

  @Post('/upload-image')
  @UseInterceptors(FileInterceptor("image", {storage:multerUploadUserImage}))
  uploadImage(@UploadedFile() image:Express.Multer.File){
    if(!image){
      return "Not image uploaded";
    }
    return {image:image.filename}
  }

  @Patch('/update-image/:id')
  @UseInterceptors(FileInterceptor("image", {storage:multerUploadUserImage}))
  updateImage(@Param("id") id:string, @UploadedFile() image:Express.Multer.File){
    if(!image){
      return "Not image uploaded";
    }
    return this.userService.updateImage(id,image)
  }

  @Post("/register")
  register(@Body() createUserDto: RegisterDto) {
    return this.userService.register(createUserDto);
  }

  @Post("/login")
  login(@Body() data: loginDto){
    return this.userService.login(data)
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,UserRole.STAFF])
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,UserRole.STAFF])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,UserRole.STAFF])
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,UserRole.STAFF])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }


  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,UserRole.STAFF])
  @Post("/send-otp-reset")
  sendResetOtp(@Request() req) {
    const userId = req.user.id;
    return this.userService.sendOtpToResetPassword(userId);
  }


  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,UserRole.STAFF])
  @Post('/verify-otp-reset')
  verifyResetOtp(@Request() req, @Body() body: otps) {
    const userId = req.user.id;
    return this.userService.verifyOtpToReset(body, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER,UserRole.STAFF])
  @Patch('reset-password')
  resetPassword(@Request() req, @Body() data:newPasswordDto){
    let userId = req.user.id;
    return this.userService.resetPassword(data, userId)
  } 

}
