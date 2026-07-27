import { Controller, Get, Query, Request } from '@nestjs/common';
import { SavingService } from './saving.service';
import { SavingsPeriodAnalysisDto } from './dto/savings-period-analysis.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

@Controller('saving')
export class SavingController {
  constructor(private readonly savingService: SavingService) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.savingService.findAll(userId);
  }

  @Get('update')
  updateAllByUser(
    @Request() req: AuthenticatedRequest,
    @Query('numMonths') numMonths?: string,
  ) {
    const userId = req.user.id;
    return this.savingService.updateAllByUser(userId, { numMonths });
  }

  @Get('period-analysis')
  async getPeriodAnalysis(
    @Request() req: AuthenticatedRequest,
    @Query() query: SavingsPeriodAnalysisDto,
  ) {
    const userId = req.user.id;
    return this.savingService.getPeriodAnalysis(userId, query);
  }
}
