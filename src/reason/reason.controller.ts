import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { ReasonService } from './reason.service';
import { CreateReasonDto } from './dto/create-reason.dto';
import { UpdateReasonDto } from './dto/update-reason.dto';
// import { JwtAuthGuard } from 'src/shared/token.guard';
// import { JwtRoleGuard } from 'src/shared/role.guard';
// import { Roles } from 'src/shared/role.decorator';

@Controller('reason')
export class ReasonController {
  constructor(private readonly reasonService: ReasonService) {}

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Post()
  create(@Body() dto: CreateReasonDto) {
    return this.reasonService.create(dto);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Get()
  findAll() {
    return this.reasonService.findAll();
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reasonService.findOne(id);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReasonDto) {
    return this.reasonService.update(id, dto);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reasonService.remove(id);
  }
}
