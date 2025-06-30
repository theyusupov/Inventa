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
  Request,
  Query,
  Res
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, loginDto, RegisterDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
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
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.OWNER])
  @Post('/create-user')
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({
    schema: {
      example: {
        fullName: 'Ruzimuhammad Yusupov',
        phoneNumber: '998901234567',
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
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with filters, sorting, and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.findAll({
      search,
      sortBy,
      order,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '10'),
    });
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Your profile' })
  @Get('my-profile')
  me( @Request() req) {
    let userId = req.user.id
    return this.userService.me(userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiBody({
    schema: {
      example: {
        fullName: 'Nurullo Yusupov',
        phoneNumber: '998903214567',
        balance: 0,
        role: 'STAFF'
      }
    }
  })
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
  @Roles([UserRole.OWNER, UserRole.STAFF])
  @Get('export/excel')
  @ApiOperation({ summary: 'Export all users to Excel' })
  async exportUsersToExcel(@Res() res: Response) {
    return this.userService.exportToExcel(res);
  }




}
