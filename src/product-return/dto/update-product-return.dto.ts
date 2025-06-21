import { PartialType } from '@nestjs/mapped-types';
import { CreateProductReturnDto } from './create-product-return.dto';

export class UpdateProductReturnDto extends PartialType(CreateProductReturnDto) {}
