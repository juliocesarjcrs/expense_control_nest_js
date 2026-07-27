import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetFilterQuery } from './interfaces/budget-filter-query.interface';
import {
  BudgetSummaryRawRow,
  BudgetSummaryResult,
  DetectCityRawRow,
} from './interfaces/budget-summary-raw-row.interface';

interface CategorySummary {
  categoryId: number;
  categoryName: string;
  budget: number;
  subcategories: Array<{
    subcategoryId: number;
    subcategoryName: string;
    budget: number;
  }>;
}

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
  ) {}

  async createBudgets(budgets: CreateBudgetDto[]): Promise<Budget[]> {
    const createdBudgets = await this.budgetRepository.save(budgets);
    return createdBudgets;
  }

  async findAll(
    userId: number,
    query: BudgetFilterQuery,
  ): Promise<{ data: Budget[] }> {
    const { year, city } = query;
    const budgetByuser = await this.budgetRepository
      .createQueryBuilder('budget')
      .where('budget.user_id = :userId', { userId })
      .andWhere('budget.year = :year', { year })
      .andWhere('budget.city = :city', { city })
      .getMany();
    return {
      data: budgetByuser,
    };
  }

  async remove(id: number): Promise<DeleteResult> {
    const response = await this.budgetRepository.delete(id);
    if ((response.affected ?? 0) <= 0) {
      throw new NotFoundException('Budget not found');
    }
    return response;
  }

  /**
   * Obtiene un resumen de presupuestos agrupados por categoría
   * para un año y ciudad específicos
   *
   * Si no existe presupuesto para esa ciudad/año, retorna vacío
   * (el frontend usará categories.budget como fallback)
   */
  async getSummaryByCategory(
    userId: number,
    query: BudgetFilterQuery,
  ): Promise<BudgetSummaryResult> {
    const { year, city } = query;

    const budgets = await this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoinAndSelect(
        'categories',
        'category',
        'category.id = budget.category_id',
      )
      .leftJoinAndSelect(
        'subcategory',
        'subcategory',
        'subcategory.id = budget.subcategory_id',
      )
      .select([
        'budget.categoryId as categoryId',
        'category.name as categoryName',
        'budget.subcategoryId as subcategoryId',
        'subcategory.name as subcategoryName',
        'budget.budget as budget',
      ])
      .where('budget.user_id = :userId', { userId })
      .andWhere('budget.year = :year', { year })
      .andWhere('budget.city = :city', { city })
      .getRawMany<BudgetSummaryRawRow>();

    if (budgets.length === 0) {
      return {
        data: [],
        year,
        city,
        hasData: false,
      };
    }

    const categoryMap = new Map<number, CategorySummary>();

    budgets.forEach((row) => {
      const categoryId = row.categoryId;
      let category = categoryMap.get(categoryId);

      if (!category) {
        category = {
          categoryId,
          categoryName: row.categoryName,
          budget: 0,
          subcategories: [],
        };
        categoryMap.set(categoryId, category);
      }

      category.budget += parseInt(row.budget, 10);
      category.subcategories.push({
        subcategoryId: row.subcategoryId,
        subcategoryName: row.subcategoryName,
        budget: parseInt(row.budget, 10),
      });
    });

    return {
      data: Array.from(categoryMap.values()),
      year,
      city,
      hasData: true,
    };
  }

  /**
   * Detecta automáticamente la ciudad más reciente del usuario
   * basándose en sus presupuestos guardados
   */
  async detectCurrentCity(
    userId: number,
    year: string,
  ): Promise<string | null> {
    const result = await this.budgetRepository
      .createQueryBuilder('budget')
      .select('budget.city')
      .addSelect('MAX(budget.created_at)', 'lastUpdate')
      .where('budget.user_id = :userId', { userId })
      .andWhere('budget.year = :year', { year })
      .groupBy('budget.city')
      .orderBy('lastUpdate', 'DESC')
      .limit(1)
      .getRawOne<DetectCityRawRow>();

    return result?.budget_city ?? null;
  }
}
