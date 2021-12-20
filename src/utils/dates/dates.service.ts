import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import 'moment/locale/es'; // without this line it didn't work
moment.locale('es');

@Injectable()
export class DatesService {
  startMonth(date): string {
    return moment(date).startOf('month').format('YYYY-MM-DD');
  }

  endMonth(date): string {
    return moment(date).endOf('month').format('YYYY-MM-DD');
  }

  monthAgo(num = 3): string {
    return moment()
      .subtract(num, 'months')
      .startOf('month')
      .format('YYYY-MM-DD');
  }

  endActualyMonth() {
    return moment().endOf('month').format('YYYY-MM-DD');
  }

  getMonthString(month: number): string {
    return moment(month, 'MM').format('MMMM');
  }
  getFormatDate(date: Date, format = 'YYYY-MM-DD'): string {
    return moment(date).format(format);
  }
}
