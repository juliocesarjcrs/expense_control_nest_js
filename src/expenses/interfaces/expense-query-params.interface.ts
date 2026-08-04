import { ExpenseNature } from '../enums/expense-nature.enum';
export interface NumMonthsQueryParams {
  numMonths?: string;
  nature?: ExpenseNature;
}

export interface DateQueryParams {
  date?: string;
}

export interface FindLastQueryParams {
  take?: string;
  page?: string;
  query?: string;
  orderBy?: string;
}
