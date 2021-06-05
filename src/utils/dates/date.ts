import * as moment from 'moment';
import 'moment/locale/es'; // without this line it didn't work
moment.locale('es');

export const startMonth = (date) => {
  const send = moment(date).startOf('month').format('YYYY-MM-DD');
  return send;
};
export const endMonth = (date) => {
  const send = moment(date).endOf('month').format('YYYY-MM-DD');
  return send;
};
export const monthAgo = (num = 3) => {
  const send = moment()
    .subtract(num, 'months')
    .startOf('month')
    .format('YYYY-MM-DD');
  return send;
};

export const endActualyMonth = () => {
  const send = moment().endOf('month').format('YYYY-MM-DD');
  return send;
};
export const getMonthString = (month: number) => {
  const send = moment(month, 'MM').format('MMMM');
  return send;
};
