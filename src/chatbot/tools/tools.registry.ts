import { Injectable, Logger } from '@nestjs/common';
import { ToolDefinition, ToolExecutor } from '../interfaces/tool.interface';
import { ExpensesExecutor } from './executors/expenses.executor';

/**
 * Registro centralizado de todas las herramientas disponibles
 * Esto permite agregar/remover tools de forma dinámica
 */
@Injectable()
export class ToolsRegistry {
  private readonly logger = new Logger(ToolsRegistry.name);
  private tools: Map<string, ToolDefinition> = new Map();
  private executors: Map<string, ToolExecutor> = new Map();

  /**
   * Registra una nueva herramienta con su executor
   */
  registerTool(definition: ToolDefinition, executor: ToolExecutor): void {
    this.tools.set(definition.function.name, definition);
    this.executors.set(definition.function.name, executor);
  }

  /**
   * Obtiene todas las definiciones de herramientas para OpenAI
   */
  getAllToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Obtiene el executor de una herramienta específica
   */
  getExecutor(toolName: string): ToolExecutor | undefined {
    return this.executors.get(toolName);
  }

  /**
   * Verifica si una herramienta existe
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * ✅ NUEVO: Inicializa TODAS las tools con sus executors
   */
  initializeAllTools(executors: {
    expensesExecutor: ToolExecutor;
    incomesExecutor: ToolExecutor;
    savingsExecutor: ToolExecutor;
    budgetsExecutor: ToolExecutor;
    loansExecutor: ToolExecutor;
  }): void {
    this.logger.log('🚀 Initializing all tools...');

    // Registrar cada tool con su executor
    this.registerTool(ExpensesTool, executors.expensesExecutor);
    this.registerTool(IncomesTool, executors.incomesExecutor);
    this.registerTool(SavingsTool, executors.savingsExecutor);
    this.registerTool(BudgetsTool, executors.budgetsExecutor);
    this.registerTool(LoansTool, executors.loansExecutor);

    this.logger.log(`✅ Total tools registered: ${this.tools.size}`);
    this.logger.log(
      `📋 Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
    );
  }
}

/**
 * Definiciones de herramientas financieras
 */
export const ExpensesTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_expenses',
    // description: 'Obtiene los gastos del usuario con información detallada de categorías y subcategorías. Puede filtrar por fechas, categorías, subcategorías o rangos de monto. Útil para responder preguntas como "¿cuándo gasté en transporte?", "¿cuánto llevo gastado este mes?", analizar patrones de gasto, comparar períodos o identificar gastos excesivos.',
    description: `
      Obtiene los gastos del usuario con información detallada de categorías y subcategorías.
      Puede filtrar por fechas, categorías, subcategorías o rangos de monto.
      También entiende consultas específicas como "transporte al trabajo" o "comidas fuera de casa",
      donde la subcategoría puede estar implícita en la frase.
      Útil para responder preguntas como:
      - "¿Cuánto gasté en transporte al trabajo este mes?"
      - "¿Cuánto he gastado en comida rápida este mes?"
      - "¿Qué tanto he gastado en entretenimiento los fines de semana?"
    `,
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date',
          description:
            'Fecha de inicio (YYYY-MM-DD). Si no se especifica, toma el mes actual',
        },
        endDate: {
          type: 'string',
          format: 'date',
          description:
            'Fecha final (YYYY-MM-DD). Si no se especifica, toma hasta hoy',
        },
        category: {
          type: 'string',
          description:
            'Nombre de categoría o subcategoría para filtrar (búsqueda parcial, ej: "transporte", "comida", "uber"). Busca tanto en categorías principales como subcategorías',
        },
        subcategory: {
          type: 'string',
          description:
            'Nombre específico de subcategoría para filtrar con mayor precisión',
        },
        minAmount: {
          type: 'number',
          description: 'Monto mínimo del gasto a filtrar',
        },
        maxAmount: {
          type: 'number',
          description: 'Monto máximo del gasto a filtrar',
        },
        limit: {
          type: 'number',
          description:
            'Número máximo de resultados a retornar (opcional). Si no se especifica, retorna todos los gastos del período',
        },
      },
      required: [],
    },
  },
};

export const IncomesTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_incomes',
    description:
      'Obtiene los ingresos del usuario con información de categorías. Puede filtrar por fechas o categoría de ingreso. Útil para responder "¿cuánto he ganado este mes?", analizar fuentes de ingreso, comparar con gastos o planificar presupuesto.',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date',
          description:
            'Fecha de inicio (YYYY-MM-DD). Si no se especifica, toma el mes actual',
        },
        endDate: {
          type: 'string',
          format: 'date',
          description:
            'Fecha final (YYYY-MM-DD). Si no se especifica, toma hasta hoy',
        },
        category: {
          type: 'string',
          description:
            'Categoría de ingreso para filtrar (búsqueda parcial, ej: "salario", "freelance")',
        },
        minAmount: {
          type: 'number',
          description: 'Monto mínimo del ingreso a filtrar',
        },
        maxAmount: {
          type: 'number',
          description: 'Monto máximo del ingreso a filtrar',
        },
        limit: {
          type: 'number',
          description:
            'Número máximo de resultados (opcional). Sin límite por defecto',
        },
      },
      required: [],
    },
  },
};

export const LoansTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_loans',
    description:
      'Obtiene información sobre préstamos y deudas del usuario (type=0 para préstamos que dio, type=1 para deudas que tiene). Útil para responder "¿cuánto debo?", "¿quién me debe?", analizar deuda total o hacer seguimiento de préstamos.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'number',
          enum: [0, 1],
          description:
            '0 = préstamos que diste (te deben), 1 = deudas que tienes (debes)',
        },
        minAmount: {
          type: 'number',
          description: 'Monto mínimo a filtrar',
        },
        maxAmount: {
          type: 'number',
          description: 'Monto máximo a filtrar',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (opcional)',
        },
      },
      required: [],
    },
  },
};

export const BudgetsTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_budgets',
    description:
      'Obtiene los presupuestos configurados por el usuario con su progreso y uso actual. Muestra presupuestos por categoría, subcategoría y año. Útil para responder "¿cómo va mi presupuesto?", control de gastos y alertas de sobregasto.',
    parameters: {
      type: 'object',
      properties: {
        year: {
          type: 'number',
          description:
            'Año del presupuesto. Si no se especifica, toma el año actual',
        },
        category: {
          type: 'string',
          description: 'Categoría o subcategoría específica para filtrar',
        },
        city: {
          type: 'string',
          description: 'Ciudad específica del presupuesto',
        },
      },
      required: [],
    },
  },
};

export const SavingsTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_savings',
    description:
      'Obtiene el registro de ahorros del usuario por fecha. Muestra el ahorro calculado (ingreso - gasto) para cada período. Útil para responder "¿cuánto ahorré este mes?", ver tendencias de ahorro y analizar capacidad de ahorro.',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date',
          description:
            'Fecha de inicio (YYYY-MM-DD). Si no se especifica, toma el mes actual',
        },
        endDate: {
          type: 'string',
          format: 'date',
          description:
            'Fecha final (YYYY-MM-DD). Si no se especifica, toma hasta hoy',
        },
        minSaving: {
          type: 'number',
          description:
            'Ahorro mínimo a filtrar (puede ser negativo si hubo pérdidas)',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (opcional)',
        },
      },
      required: [],
    },
  },
};

export const FinancialSummaryTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_financial_summary',
    description:
      'Obtiene un resumen financiero completo: ingresos totales, gastos totales, ahorro neto, balance por categorías y comparación con períodos anteriores. Ideal para responder "¿cómo está mi situación financiera?" o análisis general de salud financiera.',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date',
          description:
            'Fecha de inicio del período (YYYY-MM-DD). Por defecto, inicio del mes actual',
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'Fecha final del período (YYYY-MM-DD). Por defecto, hoy',
        },
        compareWithPrevious: {
          type: 'boolean',
          description: 'Comparar con el período anterior del mismo tamaño',
          default: true,
        },
      },
      required: [],
    },
  },
};
