import { Module } from '@nestjs/common';
import { DatesService } from './dates.service';

@Module({
  providers: [DatesService],
  exports: [DatesService],
})
export class DatesModule {}
