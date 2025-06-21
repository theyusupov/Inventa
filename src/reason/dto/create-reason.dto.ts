import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReasonDto {
  @IsString()
  @IsNotEmpty()
  reasonText: string;
}
