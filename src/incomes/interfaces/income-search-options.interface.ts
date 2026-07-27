export interface IncomeSearchOptions {
  startDate?: Date;
  endDate?: Date;
  searchValue?: string;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}
