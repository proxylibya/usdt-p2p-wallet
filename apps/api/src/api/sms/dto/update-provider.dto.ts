import { PartialType } from '@nestjs/swagger';
import { CreateSmsProviderDto } from './create-provider.dto';

export class UpdateSmsProviderDto extends PartialType(CreateSmsProviderDto) {}
