import * as moment from 'moment';

export const startMonth = () => {
  return moment().startOf('month').format('YYYY-MM-DD');
};
export const endMonth = () => {
  return moment().endOf('month').format('YYYY-MM-DD');
};
