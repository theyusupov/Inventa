import { Controller, Post, Get, Param, Delete, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { UpdateContractDto } from './dto/update-contract.dto';

@Controller('contract')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateContractDto, @Request() req) {
    const userId = req.user.id;
    return this.contractService.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.contractService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
  return this.contractService.update(id, dto);
}

}
