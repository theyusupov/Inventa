import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards,} from '@nestjs/common';
import { PartnerService } from './partner.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
// import { Roles } from 'src/shared/role.decorator';

@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF]) 
   @Post()
  create(@Body() createPartnerDto: CreatePartnerDto, @Request() req) {
    let userId = req.user.id
    return this.partnerService.create(createPartnerDto, userId);
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Get()
  findAll() {
    return this.partnerService.findAll();
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnerService.findOne(id); 
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartnerDto: UpdatePartnerDto) {
    return this.partnerService.update(id, updatePartnerDto); 
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partnerService.remove(id); 
  }
}
