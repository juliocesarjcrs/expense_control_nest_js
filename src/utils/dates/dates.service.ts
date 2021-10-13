import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import 'moment/locale/es'; // without this line it didn't work
moment.locale('es');

@Injectable()
export class DatesService {
  startMonth(date): string {
    const send = moment(date).startOf('month').format('YYYY-MM-DD');
    return send;
  }

  endMonth(date): string {
    const send = moment(date).endOf('month').format('YYYY-MM-DD');
    return send;
  }

  monthAgo(num = 3): string {
    const send = moment()
      .subtract(num, 'months')
      .startOf('month')
      .format('YYYY-MM-DD');
    return send;
  }

  endActualyMonth() {
    const send = moment().endOf('month').format('YYYY-MM-DD');
    return send;
  }

  getMonthString(month: number): string {
    const send = moment(month, 'MM').format('MMMM');
    return send;
  }
}
