import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductActionHistoryService } from './product-action-history.service';
// import { JwtAuthGuard } from 'src/shared/token.guard';
// import { JwtRoleGuard } from 'src/shared/role.guard';
// import { Roles } from 'src/shared/role.decorator';


@Controller('product-action-history')
export class ProductActionHistoryController {
  constructor(private readonly productActionHistoryService: ProductActionHistoryService) {}

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Get()
  findAll() {
    return this.productActionHistoryService.findAll();
  }

  // @UseGuards(JwtAuthGuard, JwtRoleGuard)
  // @Roles([UserRole.STAFF])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productActionHistoryService.remove(id);
  }
}
