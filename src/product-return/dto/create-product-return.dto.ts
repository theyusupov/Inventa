import { IsBoolean, IsString } from 'class-validator';

export class CreateProductReturnDto {
  @IsBoolean()
  isNew: boolean;

  @IsString()
  contractId: string;

  @IsString()
  reasonId: string;
}
