import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, loginDto, RegisterDto, SendotpDto, verifyOtpDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
// import { multerUploadUserImage } from 'src/shared/multer';
import { Express } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/shared/guards/role.decorator';
import { multerUploadUserImage } from 'src/shared/multer';
// import { JwtAuthGuard } from 'src/shared/token.guard';
// import { JwtRoleGuard } from 'src/shared/role.guard';
// import { Roles } from 'src/shared/role.decorator';

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

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.OWNER])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.OWNER,UserRole.STAFF])
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.OWNER,UserRole.STAFF])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
