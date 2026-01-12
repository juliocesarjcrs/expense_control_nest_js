import { Controller, Get, Query, Request } from '@nestjs/common';
import { SavingService } from './saving.service';
import { SavingsPeriodAnalysisDto } from './dto/savings-period-analysis.dto';

@Controller('saving')
export class SavingController {
  constructor(private readonly savingService: SavingService) {}

  @Get()
  findAll(@Request() req) {
    const userId = req.user.id;
    return this.savingService.findAll(userId);
  }

  @Get('update')
  updateAllByUser(@Request() req, @Query() query) {
    const userId = req.user.id;
    return this.savingService.updateAllByUser(userId, query);
  }

  @Get('period-analysis')
  async getPeriodAnalysis(
    @Request() req,
    @Query() query: SavingsPeriodAnalysisDto,
  ) {
    const userId = req.user.id;
    return this.savingService.getPeriodAnalysis(userId, query);
  }
}
