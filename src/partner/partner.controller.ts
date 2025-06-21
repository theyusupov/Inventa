import {
  Controller, Get, Post, Body, Patch, Param, Delete,
} from '@nestjs/common';
import { PartnerService } from './partner.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post()
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnerService.create(createPartnerDto);
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
