export interface BudgetSummaryRawRow {
  categoryId: number;
  categoryName: string;
  subcategoryId: number;
  subcategoryName: string;
  budget: string; // viene como string desde getRawMany(), de ahí el parseInt existente
}

export interface DetectCityRawRow {
  budget_city: string;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  budget: number;
  subcategories: Array<{
    subcategoryId: number;
    subcategoryName: string;
    budget: number;
  }>;
}

export interface BudgetSummaryResult {
  data: CategorySummary[];
  year: string;
  city: string;
  hasData: boolean;
}
