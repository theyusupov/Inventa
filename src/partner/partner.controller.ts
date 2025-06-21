import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards,} from '@nestjs/common';
import { PartnerService } from './partner.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';

@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPartnerDto: CreatePartnerDto, @Request() req) {
    let userId = req.user.id
    return this.partnerService.create(createPartnerDto, userId);
  }

  @Get()
  findAll() {
    return this.partnerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnerService.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartnerDto: UpdatePartnerDto) {
    return this.partnerService.update(id, updatePartnerDto); 
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partnerService.remove(id); 
  }
}
