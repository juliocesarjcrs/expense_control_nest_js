import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear'; // import plugin
import 'dayjs/locale/es'; // import locale

dayjs.extend(isLeapYear); // use plugin
dayjs.locale('es');

@Injectable()
export class DatesService {
  startMonth(date: string | null): Date {
    const mydate = dayjs(date ?? undefined)
      .startOf('month')
      .format('YYYY-MM-DD');
    return new Date(mydate);
  }

  endMonth(date: string | null): Date {
    const mydate = dayjs(date ?? undefined)
      .endOf('month')
      .format('YYYY-MM-DD');
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
    const dateStartDate = dayjs().subtract(take, 'months').startOf('month');
    for (let i = 1; i <= take; i++) {
      const tempDate = dateStartDate.add(i, 'months');
      labels.push(`${tempDate.format('MMM -YYYY')}`);
      fullDate.push({
        month: tempDate.month() + 1,
        year: tempDate.year(),
        date: tempDate.format('YYYY-MM-DD'),
      });
    }
    return { labels, fullDate };
  }

  startMonthRaw(date: string | null): dayjs.Dayjs {
    return dayjs(date ?? undefined).startOf('month');
  }

  endMonthRaw(date: string | null): dayjs.Dayjs {
    return dayjs(date ?? undefined).endOf('month');
  }

  getDate(date: string | Date): dayjs.Dayjs {
    return dayjs(date);
  }

  startMonthRawNew(date: string | null): string {
    const today = dayjs();
    const selectedMonth = date ? dayjs(date) : today;
    const startMonth = selectedMonth.startOf('month');
    return startMonth.format('YYYY-MM-DD HH:mm:ss.SSS');
  }

  endMonthRawNew(date: string | null): string {
    const today = dayjs();
    const selectedMonth = date ? dayjs(date) : today;
    const endMonth = selectedMonth.endOf('month');
    return endMonth.format('YYYY-MM-DD HH:mm:ss.SSS');
  }
}
