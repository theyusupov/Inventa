import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PartnerService } from './partner.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from 'src/shared/guards/token.guard';
import { JwtRoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/guards/role.decorator';
import { UserRole } from 'generated/prisma';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Partner')
@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new partner' })
  @ApiBody({
    description: 'Partner create body',
    type: CreatePartnerDto,
    examples: {
      example1: {
        summary: 'Seller example',
        value: {
          fullName: 'Ali Karimov',
          phoneNumber: '+998-90-123-45-67',
          address: 'Toshkent, Chilonzor',
          isActive: true,
          balance: 0,
          role: 'SELLER',
        },
      },
      example2: {
        summary: 'Customer example',
        value: {
          fullName: 'Olimaxon Ismoilova',
          phoneNumber: '+998-91-111-22-33',
          address: 'Andijon, Asaka',
          isActive: true,
          balance: 0,
          role: 'CUSTOMER',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Partner created successfully' })
  create(@Body() createPartnerDto: CreatePartnerDto, @Request() req) {
    const userId = req.user.id;
    return this.partnerService.create(createPartnerDto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all partners' })
  @ApiResponse({ status: 200, description: 'List of partners' })
  findAll() {
    return this.partnerService.findAll();
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one partner by ID' })
  @ApiResponse({ status: 200, description: 'Partner data returned' })
  findOne(@Param('id') id: string) {
    return this.partnerService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a partner by ID' })
  @ApiBody({
    description: 'Partner update body',
    type: UpdatePartnerDto,
    examples: {
      example1: {
        summary: 'Sample update',
        value: {
          fullName: 'Ali Karimov',
          phoneNumber: '+998-90-123-45-67',
          address: 'Toshkent, Chilonzor',
          isActive: true,
          balance: 5000,
          role: 'SELLER',
        },
      },
    },
  })

  @ApiResponse({ status: 200, description: 'Partner updated successfully' })
  update(@Param('id') id: string, @Body() updatePartnerDto: UpdatePartnerDto, @Request() req) {
    const userId = req.user.id;
    return this.partnerService.update(id, updatePartnerDto, userId);
  }

  @UseGuards(JwtAuthGuard, JwtRoleGuard)
  @Roles([UserRole.STAFF, UserRole.OWNER])
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a partner by ID' })
  @ApiResponse({ status: 200, description: 'Partner deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.partnerService.remove(id, userId);
  }
}
