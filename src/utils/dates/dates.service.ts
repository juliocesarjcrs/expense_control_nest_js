import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import 'moment/locale/es'; // without this line it didn't work
moment.locale('es');

@Injectable()
export class DatesService {
  startMonth(date: string): Date {
    let mydate = moment(date).startOf('month').format('YYYY-MM-DD');
    return new Date(mydate);
  }

  endMonth(date: string): Date {
    let mydate = moment(date).endOf('month').format('YYYY-MM-DD');
    return new Date(mydate);
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
    return moment(month, 'MM').format('MMM');
  }
  getFormatDate(date: Date, format = 'YYYY-MM-DD'): string {
    return moment(date).format(format);
  }

  actualyMonth() {
    return {
      endMonth: moment().endOf('month').format('YYYY-MM-DD'),
      numMonth: moment().month(),
    };
  }

  getPreviosMonthsLabelsIndex(take: number) {
    const index = [];
    const labels = [];
    const fullDate = [];
    const dateStart = moment().subtract(take, 'months').startOf('month');
    const dateStartYear = moment().subtract(take, 'months').startOf('month');
    let dateStartDate = moment().subtract(take, 'months').startOf('month');
    for (let i = 0; i < take; i++) {
      const a = dateStart.add(1, 'months').month() + 1;
      const year =  dateStartYear.add(1, 'months').year();
      let date =  dateStartDate.add(1, 'months').format('YYYY-MM-DD');
      index.push(a);
      labels.push(`${moment(a, 'MM').format('MMM')} ${year}`);
      fullDate.push({month: a, year, date})
    }
    return { index, labels, fullDate };
  }

  customFormatDate(date: Date) {
    const myDate = moment(date)
    const year =  myDate.year();
    return {
      monthYear: `${moment(myDate, 'MM').format('MMM')} ${year}`
    }

  }
}
