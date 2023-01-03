import { Controller, Get, Query, Request } from '@nestjs/common';
import { SavingService } from './saving.service';

@Controller('saving')
export class SavingController {

  constructor(private readonly savingService: SavingService) {}

  @Get()
  findAll(@Request() req, @Query() query) {
    const userId = req.user.id;
    return this.savingService.findAll(userId, query);
  }

  @Get('update')
  updateAllByUser(@Request() req, @Query() query) {
    const userId = req.user.id;
    return this.savingService.updateAllByUser(userId, query);
  }
}
