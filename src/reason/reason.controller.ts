import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { ReasonService } from './reason.service';
import { CreateReasonDto } from './dto/create-reason.dto';
import { UpdateReasonDto } from './dto/update-reason.dto';

@Controller('reason')
export class ReasonController {
  constructor(private readonly reasonService: ReasonService) {}

  @Post()
  create(@Body() dto: CreateReasonDto) {
    return this.reasonService.create(dto);
  }

  @Get()
  findAll() {
    return this.reasonService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reasonService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReasonDto) {
    return this.reasonService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reasonService.remove(id);
  }
}
