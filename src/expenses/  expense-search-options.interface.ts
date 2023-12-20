export interface ExpenseSearchOptions {
  subcategoriesId?: number[];
  startDate?: Date;
  endDate?: Date;
  searchValue?: string;
  orderBy?: 'date' | 'amount';
  order?: 'ASC' | 'DESC';
}
