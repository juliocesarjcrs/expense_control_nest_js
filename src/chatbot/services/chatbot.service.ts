import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { ToolsRegistry } from '../tools/tools.registry';
import { ToolExecutorService } from './tool-executor.service';
import { ConversationQueryParams } from '../interfaces/conversation-query.interface';
import { ChatMessage } from '../interfaces/chat-message.interface';
import { ConversationHistoryParams } from '../interfaces/conversation-history-query.interface';
import { AIModelManagerService } from './ai-model-manager.service';
import { ConversationLog } from '../entities/conversation-log.entity';
import { ChatbotConfigService } from 'src/chatbot-config/chatbot-config.service';
import { CategoriesService } from 'src/categories/categories.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly MAX_TOOL_ITERATIONS = 5; // Prevenir loops infinitos
  private readonly CONVERSATION_TIMEOUT = 60 * 60 * 1000; // 1 hora

  private categoriesCache: string | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hora

  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    private readonly toolsRegistry: ToolsRegistry,
    private readonly toolExecutor: ToolExecutorService,
    private readonly aiModelManager: AIModelManagerService,
    @InjectRepository(ConversationLog)
    private conversationLogRepo: Repository<ConversationLog>,
    private readonly chatbotConfigService: ChatbotConfigService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async getRecentConversations(params: ConversationQueryParams) {
    const { userId, limit = 0, page = 1 } = params;
    const skip = (page - 1) * limit;

    const [conversations, total] = await this.conversationRepo.findAndCount({
      where: { userId },
      relations: ['messages'],
      order: { createdAt: 'DESC' },
      take: limit || undefined, // Si limit es 0, no se aplica límite
      skip: limit ? skip : 0, // Solo aplicar skip si hay límite
    });

    return {
      data: conversations.map((conversation) => ({
        id: conversation.id,
        createdAt: conversation.createdAt,
        lastMessage:
          conversation.messages[conversation.messages.length - 1]?.content ||
          null,
        messageCount: conversation.messages.length,
      })),
      metadata: {
        total,
        page,
        limit,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }
  async createConversation(userId: number) {
    const conversation = this.conversationRepo.create({
      provider: process.env.AI_PROVIDER || 'openai',
      userId,
    });
    const savedConversation = await this.conversationRepo.save(conversation);

    // Guardar el mensaje del sistema
    const systemPrompt = await this.getSystemPrompt(userId);
    const systemMessage = this.messageRepo.create({
      content: systemPrompt.content,
      role: 'system',
      conversation: { id: savedConversation.id },
      userId,
    });

    await this.messageRepo.save(systemMessage);

    return savedConversation;
  }
  /**
   * Procesa un mensaje del usuario con soporte completo para function calling
   */
  async sendMessage(conversationId: number, content: string, userId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(
        "You don't have access to this conversation",
      );
    }

    // Guardar mensaje del usuario
    const userMessage = this.messageRepo.create({
      content,
      role: 'user',
      conversation,
      userId,
    });
    await this.messageRepo.save(userMessage);

    // Obtener historial de mensajes
    const messageHistory = await this.getRecentMessages(conversationId, userId);

    // Obtener todas las tools disponibles
    const availableTools = this.toolsRegistry.getAllToolDefinitions();

    this.logger.log(
      `Processing message with ${availableTools.length} tools available`,
    );

    // Ejecutar el loop de function calling
    const finalResponse = await this.executeFunctionCallingLoop(
      messageHistory,
      availableTools,
      { userId, conversationId },
    );
    // this.logger.debug(`Final reponse: ${finalResponse.content}`)

    // Guardar respuesta del asistente
    const aiMessage = this.messageRepo.create({
      content: finalResponse.content,
      role: 'assistant',
      conversation,
      userId,
    });

    return { data: await this.messageRepo.save(aiMessage) };
  }

  private async getRecentMessages(
    conversationId: number,
    userId: number,
  ): Promise<ChatMessage[]> {
    const messages = await this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'ASC' },
      // take: 10,
    });
    const systemMessage = messages.find((msg) => msg.role === 'system');
    if (!systemMessage) {
      return [
        await this.getSystemPrompt(userId),
        ...messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
      ];
    }
    return messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  private isConversationExpired(lastMessageDate: Date): boolean {
    return Date.now() - lastMessageDate.getTime() > this.CONVERSATION_TIMEOUT;
  }

  async getConversationHistory(params: ConversationHistoryParams) {
    const { conversationId, userId, limit = 0, page = 1 } = params;
    const skip = (page - 1) * limit;

    // Verificar que la conversación existe y pertenece al usuario
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(
        "You don't have access to this conversation",
      );
    }

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'ASC' },
      take: limit || undefined,
      skip: limit ? skip : 0,
    });

    return {
      data: messages.map((message) => ({
        id: message.id,
        content: message.content,
        role: message.role,
        createdAt: message.createdAt,
      })),
      metadata: {
        total,
        page,
        limit,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }
  async deleteConversation(conversationId: number, userId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(
        "You don't have access to this conversation",
      );
    }

    // Eliminar la conversación (CASCADE eliminará los mensajes automáticamente)
    await this.conversationRepo.remove(conversation);

    return {
      success: true,
      message: 'Conversation deleted successfully',
    };
  }

  /**
   * Loop principal de function calling
   * Maneja múltiples llamadas a herramientas hasta obtener una respuesta final
   */
  private async executeFunctionCallingLoop(
    messages: ChatMessage[],
    tools: any[],
    context: { userId: number; conversationId: number },
  ): Promise<{ content: string }> {
    let currentMessages = [...messages];
    let iterations = 0;

    const provider = await this.aiModelManager.getCurrentProvider();
    const modelInfo = provider.getModelInfo();
    while (iterations < this.MAX_TOOL_ITERATIONS) {
      iterations++;
      this.logger.debug(`Function calling iteration ${iterations}`);

      // Llamar a OpenAI
      let response;
      try {
        // ✅ NO enviar tools si ya hay resultados de herramientas en el contexto
        const hasToolResults = currentMessages.some(
          (msg) => msg.role === 'tool',
        );
        const toolsToSend = hasToolResults ? undefined : tools;
        const toolChoiceToSend = hasToolResults ? undefined : 'auto';

        response = await provider.generateResponse(
          currentMessages,
          toolsToSend,
          toolChoiceToSend,
          iterations,
        );
      } catch (error) {
        // Si el modelo actual falla, intentar con el siguiente
        this.logger.warn('Current model failed, trying fallback...');
        await this.aiModelManager.switchToNextProvider();

        const fallbackProvider = await this.aiModelManager.getCurrentProvider();
        response = await fallbackProvider.generateResponse(
          currentMessages,
          tools,
          'auto',
          iterations,
        );
      }
      // Si no hay tool calls, retornamos la respuesta
      if (!response.toolCalls || response.toolCalls.length === 0) {
        this.logger.log('No tool calls - returning final response');
        return {
          content:
            response.outputText || 'Lo siento, no pude generar una respuesta.',
        };
      }

      this.logger.log(`Processing ${response.toolCalls.length} tool calls`);

      // Agregar el mensaje del asistente con tool calls al historial
      currentMessages.push({
        role: 'assistant',
        content: response.outputText,
        tool_calls: response.toolCalls,
      });

      // Ejecutar todas las tool calls
      const toolResults = await Promise.all(
        response.toolCalls.map(async (toolCall) => {
          const startTime = Date.now();
          try {
            const parameters = JSON.parse(toolCall.function.arguments);

            this.logger.debug(`Executing tool: ${toolCall.function.name}`);

            const result = await this.toolExecutor.executeToolCall(
              toolCall.function.name,
              parameters,
              context,
            );
            // this.logger.debug(`Tool ${toolCall.function.name} result:`, result);
            // ✅ GUARDAR LOG DE INTERACCIÓN
            await this.conversationLogRepo.save({
              conversationId: context.conversationId,
              userId: context.userId,
              aiModelId: modelInfo.id, // ✅ AGREGAR
              model_name: modelInfo.name, // ✅ AGREGAR
              user_query: messages[messages.length - 1]?.content || '',
              detected_intent: toolCall.function.name,
              extracted_parameters: parameters,
              tool_result: this.sanitizeToolResult(result),
              response_time: Date.now() - startTime,
              createdAt: new Date(),
            });

            return {
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              name: toolCall.function.name,
              content: JSON.stringify(
                result.success ? result.data : { error: result.error },
              ),
            };
          } catch (error) {
            this.logger.error(
              `Error executing tool ${toolCall.function.name}:`,
              error,
            );
            // ✅ TAMBIÉN guardar errores de ejecución
            await this.conversationLogRepo.save({
              conversationId: context.conversationId,
              userId: context.userId,
              user_query: messages[messages.length - 1]?.content || '',
              detected_intent: toolCall.function.name,
              extracted_parameters: JSON.parse(toolCall.function.arguments),
              tool_result: { error: error.message },
              response_time: Date.now() - startTime,
              createdAt: new Date(),
            });
            return {
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              name: toolCall.function.name,
              content: JSON.stringify({ error: error.message }),
            };
          }
        }),
      );

      // Agregar resultados de tools al historial
      toolResults.forEach((result) => {
        currentMessages.push(result);
      });

      // Continuar el loop para que el modelo procese los resultados
    }

    // Si llegamos al límite de iteraciones
    this.logger.warn('Max iterations reached in function calling loop');
    return {
      content:
        'He procesado tu consulta pero necesito más interacciones. ¿Podrías ser más específico?',
    };
  }

  private sanitizeToolResult = (result: any) => {
    if (!result) return null;

    return {
      success: result.success ?? null,
      data: {
        count: result?.data?.count ?? null,
        total: result?.data?.total ?? null,
        answer: result?.data?.answer ?? null,
      },
    };
  };

  private async getSystemPrompt(userId: number): Promise<ChatMessage> {
    // Obtener desde cache (sin query a DB)
    const promptConfig =
      await this.chatbotConfigService.getConfig('system_prompt');

    const currentDate = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Procesar template con variables
    let content = promptConfig.template || promptConfig.sections;
    const categoriesContext = await this.getCategoriesContext(userId);

    if (typeof content === 'object') {
      // Combinar secciones activas
      content = promptConfig.active_sections
        .map((section) => promptConfig.sections[section])
        .join('\n\n');
    }

    // Reemplazar variables
    content = content.replace('{{currentDate}}', currentDate);
    content = content.replace('{{categories}}', categoriesContext);
    return {
      role: 'system',
      content,
    };
  }
  private getSystemPromptLocal(): ChatMessage {
    const currentDate = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      role: 'system',
      content: `CONTEXTO TEMPORAL CRÍTICO: Hoy es ${currentDate}. Usa esta fecha exacta para cualquier cálculo, análisis o referencia temporal.
        CONTEXTO DE LA APLICACIÓN:
        Eres el asistente integrado de una aplicación de finanzas personales. El usuario utiliza esta app para registrar TODOS sus gastos, ingresos, presupuestos y metas financieras. TODA la información financiera del usuario está almacenada en esta aplicación y es accesible mediante las herramientas disponibles.

        Eres un asistente financiero personal experto. Tu objetivo es ayudar a los usuarios a:

        1. Entender su situación financiera actual
        2. Identificar patrones de gasto e ingreso
        3. Dar consejos prácticos para mejorar sus finanzas
        4. Alertar sobre gastos excesivos o presupuestos excedidos
        5. Motivar al ahorro y cumplimiento de metas

        REGLAS IMPORTANTES:

        📊 SOBRE EL ACCESO A DATOS:
        - SIEMPRE usa las herramientas disponibles para obtener datos ANTES de responder
        - NUNCA pidas al usuario que te comparta datos manualmente (gastos, ingresos, categorías, etc.)
        - Si una herramienta retorna datos vacíos o null, significa que NO EXISTEN registros para ese período/categoría
        - Cuando no hay datos, interpreta esto como: "El usuario no ha registrado información en ese período" o "No hay gastos/ingresos en esa categoría"

        ✅ RESPUESTAS CUANDO NO HAY DATOS:
        - Si no hay gastos en un período: "No tienes gastos registrados en [período]. ¡Excelente control!" o "Aún no has registrado gastos este mes"
        - Si no hay datos para análisis: "No encuentro suficiente información histórica para este análisis. Te recomiendo registrar tus movimientos durante al menos un mes"
        - NUNCA sugieras que el usuario te envíe datos manualmente
        - NUNCA preguntes si usan otra herramienta (ya están usando ESTA app)

        💬 ESTILO DE COMUNICACIÓN:
        - Sé conciso pero completo. Respuestas de 2-4 oraciones para consultas simples
        - Para análisis complejos, estructura tu respuesta con puntos clave
        - Siempre da contexto: compara con períodos anteriores cuando sea relevante
        - Usa emojis ocasionalmente para hacer la conversación más amigable
        - Si detectas problemas financieros, ofrece soluciones constructivas

        🚫 LO QUE NUNCA DEBES HACER:
        - Inventar datos que no retornan las herramientas
        - Pedir al usuario que te comparta información manualmente
        - Sugerir que usen otras herramientas o apps (YA están en la app correcta)
        - Preguntar si registran sus finanzas en otro lugar
        - Asumir que falta información si las herramientas retornan vacío (vacío = no hay datos, no = "datos no disponibles")`,
    };
  }

  /**
   * Obtiene el estado actual del modelo de IA siendo utilizado
   */
  async getCurrentModelStatus() {
    const provider = await this.aiModelManager.getCurrentProvider();
    const modelInfo = provider.getModelInfo();
    const health = await provider.getHealthStatus();

    return {
      model: modelInfo,
      health: {
        isHealthy: health.isHealthy,
        responseTime: health.responseTime,
        errorCount: health.errorCount,
        healthScore: health.healthScore,
        lastTestedAt: health.lastTestedAt,
      },
    };
  }

  /**
   * Obtiene todos los modelos disponibles
   */
  async getAllAvailableModels() {
    return this.aiModelManager.getAllModels();
  }

  /**
   * Obtiene el estado de salud de todos los modelos
   */
  async getModelsHealthStatus() {
    return this.aiModelManager.getHealthStatus();
  }

  async getInteractionAnalysis(limit: number = 50) {
    return this.conversationLogRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
  async getToolUsageStats() {
    const stats = await this.conversationLogRepo
      .createQueryBuilder('log')
      .select('log.detected_intent', 'tool')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(log.response_time)', 'avg_time')
      .groupBy('log.detected_intent')
      .orderBy('count', 'DESC')
      .getRawMany();

    return stats;
  }

  private async getCategoriesContext(userId: number): Promise<string> {
    const now = new Date();

    // Verificar si el caché es válido
    if (this.categoriesCache && this.cacheExpiry && this.cacheExpiry > now) {
      this.logger.debug('Using cached categories context');
      return this.categoriesCache;
    }

    this.logger.debug('Fetching fresh categories from database');

    try {
      const { data: categories } =
        await this.categoriesService.findAllWithSubcategories(userId);

      // ✅ Formatear para el prompt
      this.categoriesCache = this.formatCategoriesForPrompt(categories);
      this.cacheExpiry = new Date(now.getTime() + this.CACHE_TTL);

      return this.categoriesCache;
    } catch (error) {
      this.logger.error('Error fetching categories:', error);
      return this.getDefaultCategoriesContext();
    }
  }

  // ✅ FORMATEAR CATEGORÍAS PARA EL PROMPT
  private formatCategoriesForPrompt(categories: any[]): string {
    if (!categories || categories.length === 0) {
      return this.getDefaultCategoriesContext();
    }

    const categoriesText = categories
      .map((cat) => {
        const subcats =
          cat.subcategories?.map((sub) => `    - ${sub.name}`).join('\n') || '';

        return `  • ${cat.name}${subcats ? '\n' + subcats : ''}`;
      })
      .join('\n');

    return `
      📋 CATEGORÍAS Y SUBCATEGORÍAS DISPONIBLES:
      Las siguientes son las ÚNICAS categorías y subcategorías válidas en el sistema.
      Usa estos nombres EXACTOS al filtrar o interpretar consultas del usuario:

      ${categoriesText}

      🎯 REGLAS IMPORTANTES PARA BÚSQUEDA DE CATEGORÍAS:

      1. INTERPRETACIÓN DE CONSULTAS:
        - "transporte al trabajo" → category: "Transporte", subcategory: "Trabajo"
        - "comida rápida" → category: "Alimentación", subcategory: "Comida Rápida"
        - "uber" o "taxi" → category: "Transporte", subcategory: "Taxi/Uber"
        - "salidas" o "cenas" → category: "Alimentación", subcategory: "Restaurantes"
        - Si solo mencionan la categoría general (ej: "transporte"), NO uses subcategory

      2. PRIORIDAD EN PARÁMETROS:
        - Si el usuario menciona una subcategoría específica → usa el parámetro 'subcategory'
        - Si es algo general → usa solo 'category'
        - La búsqueda es parcial: "transp" encontrará "Transporte"

      3. EJEMPLOS DE USO:
        ❌ MAL: category: "transporte al trabajo" (muy específico)
        ✅ BIEN: category: "Transporte", subcategory: "Trabajo"

        ❌ MAL: category: "comidas" (impreciso)
        ✅ BIEN: category: "Alimentación" (usa el nombre exacto)

      4. CUANDO NO ENCUENTRES COINCIDENCIAS:
        - Sugiere las categorías más cercanas disponibles
        - No inventes categorías que no existen en la lista anterior
      `;
        }

  // ✅ CONTEXTO POR DEFECTO si falla la carga
  private getDefaultCategoriesContext(): string {
    return `
📋 CATEGORÍAS DISPONIBLES:
El usuario tiene categorías personalizadas en su sistema.
Usa búsqueda parcial en los parámetros 'category' y 'subcategory' para encontrar coincidencias.

IMPORTANTE: 
- Siempre consulta la herramienta get_expenses para obtener datos reales
- No asumas nombres de categorías, usa búsqueda flexible
`;
  }

  // ✅ MÉTODO PARA LIMPIAR CACHÉ MANUALMENTE (útil cuando se crean/modifican categorías)
  async invalidateCategoriesCache(): Promise<void> {
    this.logger.log('Categories cache invalidated');
    this.categoriesCache = null;
    this.cacheExpiry = null;
  }
}
