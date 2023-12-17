export interface IncomeSearchOptions {
  startDate?: Date;
  endDate?: Date;
  searchValue?: string;
  orderBy?: 'date' | 'amount';
  order?: 'ASC' | 'DESC';
}
