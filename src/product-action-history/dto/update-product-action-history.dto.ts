import { PartialType } from '@nestjs/mapped-types';
import { CreateProductActionHistoryDto } from './create-product-action-history.dto';

export class UpdateProductActionHistoryDto extends PartialType(CreateProductActionHistoryDto) {}
