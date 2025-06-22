import { PartialType } from '@nestjs/mapped-types';
import { CreateActionHistoryDto } from './create-action-history.dto';

export class UpdateActionHistoryDto extends PartialType(CreateActionHistoryDto) {}
