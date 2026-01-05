import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Budget } from './entities/budget.entity';
import { Repository } from 'typeorm';
import { CreateBudgetDto } from './dto/create-budget.dto';

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
    query: {
      year: number;
      city: string;
    },
  ) {
    const year = query.year;
    const city = query.city;
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

  async remove(id: number) {
    const response = await this.budgetRepository.delete(id);
    if (response.affected <= 0)
      throw new HttpException('Budget not found', HttpStatus.BAD_REQUEST);
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
    query: { year: number; city: string },
  ): Promise<{
    data: Array<{
      categoryId: number;
      categoryName: string;
      budget: number;
      subcategories: Array<{
        subcategoryId: number;
        subcategoryName: string;
        budget: number;
      }>;
    }>;
    year: number;
    city: string;
    hasData: boolean;
  }> {
    const { year, city } = query;

    // Obtener presupuestos del usuario para ese año/ciudad
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
      .getRawMany();

    if (budgets.length === 0) {
      return {
        data: [],
        year,
        city,
        hasData: false,
      };
    }

    // Agrupar por categoría
    const categoryMap = new Map<
      number,
      {
        categoryId: number;
        categoryName: string;
        budget: number;
        subcategories: Array<{
          subcategoryId: number;
          subcategoryName: string;
          budget: number;
        }>;
      }
    >();

    budgets.forEach((budget) => {
      const categoryId = budget.categoryId;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: budget.categoryName,
          budget: 0,
          subcategories: [],
        });
      }

      const category = categoryMap.get(categoryId);
      category.budget += parseInt(budget.budget);
      category.subcategories.push({
        subcategoryId: budget.subcategoryId,
        subcategoryName: budget.subcategoryName,
        budget: parseInt(budget.budget),
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
    year: number,
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
      .getRawOne();

    return result?.budget_city || null;
  }
}
