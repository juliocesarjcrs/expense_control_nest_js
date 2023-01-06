import { Injectable } from '@nestjs/common';
import * as dayjs  from 'dayjs';
import * as isLeapYear from 'dayjs/plugin/isLeapYear'; // import plugin
import 'dayjs/locale/es'; // import locale

dayjs.extend(isLeapYear); // use plugin
dayjs.locale('es');

@Injectable()
export class DatesService {
  startMonth(date: string): Date {
    let mydate = dayjs(date).startOf('month').format('YYYY-MM-DD');
    return new Date(mydate);
  }

  endMonth(date: string): Date {
    let mydate = dayjs(date).endOf('month').format('YYYY-MM-DD');
    return new Date(mydate);
  }

  monthAgo(num = 3): string {
    return dayjs()
      .subtract(num, 'months')
      .startOf('month')
      .format('YYYY-MM-DD');
  }

  getMonthString(month: number): string {
    return dayjs(month, 'MM').format('MMM');
  }

  getFormatDate(date: Date, format = 'YYYY-MM-DD'): string {
    return dayjs(date).format(format);
  }

  getPreviosMonthsLabelsIndex(take: number) {
    const labels = [];
    const fullDate = [];
    let dateStartDate = dayjs().subtract(take, 'months').startOf('month');
    for (let i = 1; i <= take; i++) {
      const tempDate = dateStartDate.add(i, 'months');
      labels.push(`${tempDate.format('MMM -YYYY')}`);
      fullDate.push({
        month: tempDate.month(),
        year: tempDate.year(),
        date: tempDate.format('YYYY-MM-DD')
      })
    }
    return { labels, fullDate };
  }

  startMonthRaw(date: string): dayjs.Dayjs {
    return  dayjs(date).startOf('month');
  }

  endMonthRaw(date: string):  dayjs.Dayjs {
    return  dayjs(date).endOf('month');
  }

  getDate(date: Date):  dayjs.Dayjs {
    return dayjs(date);
  }

}
