export interface CategoryQueryParams {
  type?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseAnalysisQueryParams {
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
  natures?: string; // 'operational,investment' (opcional)
}
