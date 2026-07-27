import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ToolDefinition, ToolExecutor } from '../interfaces/tool.interface';
import { ChatbotConfigService } from 'src/chatbot-config/chatbot-config.service';
import { ToolConfig, ToolsConfig } from '../interfaces/tool-config.interface';

/**
 * Registro centralizado de todas las herramientas disponibles
 * Ahora lee la configuración desde la base de datos
 */
@Injectable()
export class ToolsRegistry implements OnModuleInit {
  private readonly logger = new Logger(ToolsRegistry.name);
  private tools: Map<string, ToolDefinition> = new Map();
  private executors: Map<string, ToolExecutor> = new Map();
  private toolsConfig: ToolsConfig | null = null;

  constructor(private readonly chatbotConfigService: ChatbotConfigService) {}

  async onModuleInit() {
    await this.loadToolsFromConfig();
  }

  /**
   * Carga las tools desde la configuración en DB
   */
  private async loadToolsFromConfig(): Promise<void> {
    try {
      const config =
        await this.chatbotConfigService.getConfig<ToolsConfig>('tools_config');

      if (config && config.tools) {
        this.toolsConfig = config;
        this.logger.log(
          `📦 Loaded ${config.tools.length} tools from configuration`,
        );
      } else {
        this.logger.warn('⚠️ No tools configuration found in database');
      }
    } catch (error) {
      this.logger.error(
        'Failed to load tools configuration:',
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Registra una nueva herramienta con su executor
   */
  registerTool(definition: ToolDefinition, executor: ToolExecutor): void {
    this.tools.set(definition.function.name, definition);
    this.executors.set(definition.function.name, executor);
  }

  /**
   * Obtiene todas las definiciones de herramientas activas para el AI provider
   * Filtra según configuración de DB
   */
  getAllToolDefinitions(): ToolDefinition[] {
    const allTools = Array.from(this.tools.values());

    // Si no hay config en DB, retornar todas las tools
    if (!this.toolsConfig) {
      return allTools;
    }

    // Filtrar solo las tools activas según configuración
    const activeToolNames = this.toolsConfig.tools
      .filter((t) => t.is_active)
      .map((t) => t.name);

    return allTools
      .filter((tool) => activeToolNames.includes(tool.function.name))
      .sort((a, b) => {
        // Ordenar por prioridad definida en config
        const priorityA = this.getToolPriority(a.function.name);
        const priorityB = this.getToolPriority(b.function.name);
        return priorityA - priorityB;
      });
  }

  /**
   * Obtiene la prioridad de una tool desde la config
   */
  private getToolPriority(toolName: string): number {
    const toolConfig = this.toolsConfig?.tools.find((t) => t.name === toolName);
    return toolConfig?.priority || 999;
  }

  /**
   * Obtiene el executor de una herramienta específica
   */
  getExecutor(toolName: string): ToolExecutor | undefined {
    return this.executors.get(toolName);
  }

  /**
   * Verifica si una herramienta existe y está activa
   */
  hasTool(toolName: string): boolean {
    // Verificar que existe en registry
    if (!this.tools.has(toolName)) {
      return false;
    }

    // Si hay config, verificar que esté activa
    if (this.toolsConfig) {
      const toolConfig = this.toolsConfig.tools.find(
        (t) => t.name === toolName,
      );
      return toolConfig?.is_active || false;
    }

    return true;
  }

  /**
   * Inicializa TODAS las tools con sus executors
   * Se debe llamar manualmente desde el módulo
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
    this.registerTool(this.buildExpensesTool(), executors.expensesExecutor);
    this.registerTool(this.buildIncomesTool(), executors.incomesExecutor);
    this.registerTool(this.buildSavingsTool(), executors.savingsExecutor);
    this.registerTool(this.buildBudgetsTool(), executors.budgetsExecutor);
    this.registerTool(this.buildLoansTool(), executors.loansExecutor);
    this.registerTool(
      this.buildFinancialSummaryTool(),
      executors.loansExecutor,
    ); // Reutiliza executor

    this.logger.log(`✅ Total tools registered: ${this.tools.size}`);
    this.logger.log(
      `📋 Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
    );
  }

  /**
   * Recarga las tools desde la configuración
   * Útil cuando se actualizan desde el admin panel
   */
  async reloadToolsConfig(): Promise<void> {
    await this.loadToolsFromConfig();
    this.logger.log('🔄 Tools configuration reloaded');
  }

  /**
   * Obtiene la configuración actual de una tool específica
   */
  getToolConfig(toolName: string): ToolConfig | undefined {
    return this.toolsConfig?.tools.find((t) => t.name === toolName);
  }

  // ==========================================
  // BUILDERS DE TOOL DEFINITIONS
  // Estas se mantienen en código para garantizar
  // la estructura correcta del schema OpenAI
  // ==========================================

  private buildExpensesTool(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: 'get_expenses',
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
  }

  private buildIncomesTool(): ToolDefinition {
    return {
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
  }

  private buildLoansTool(): ToolDefinition {
    return {
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
  }

  private buildBudgetsTool(): ToolDefinition {
    return {
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
  }

  private buildSavingsTool(): ToolDefinition {
    return {
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
  }

  private buildFinancialSummaryTool(): ToolDefinition {
    return {
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
              description:
                'Fecha final del período (YYYY-MM-DD). Por defecto, hoy',
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
  }
}
