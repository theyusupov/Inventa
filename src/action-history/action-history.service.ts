import { Injectable } from '@nestjs/common';
import { CreateActionHistoryDto } from './dto/create-action-history.dto';
import { UpdateActionHistoryDto } from './dto/update-action-history.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActionHistoryService {
  constructor(readonly prisma:PrismaService){}
  async findAll() {
    return await this.prisma.actionHistory.findMany();
  }

  async remove(id: string) {
    await this.prisma.actionHistory.delete({where:{id}})
    return {message:"History deleted successfully!"};
  }
}
