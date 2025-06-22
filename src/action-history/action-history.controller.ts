import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActionHistoryService } from './action-history.service';
import { CreateActionHistoryDto } from './dto/create-action-history.dto';
import { UpdateActionHistoryDto } from './dto/update-action-history.dto';

@Controller('action-history')
export class ActionHistoryController {
  constructor(private readonly actionHistoryService: ActionHistoryService) {}

  @Get()
  findAll() {
    return this.actionHistoryService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.actionHistoryService.remove(id);
  }
}
