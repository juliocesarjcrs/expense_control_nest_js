import * as moment from 'moment';

export const startMonth = (date) => {
  const send = moment(date).startOf('month').format('YYYY-MM-DD');
  console.log('send', send);
  return send;
};
export const endMonth = (date) => {
  const send = moment(date).endOf('month').format('YYYY-MM-DD');
  console.log('send end ', send);
  return send;
};
