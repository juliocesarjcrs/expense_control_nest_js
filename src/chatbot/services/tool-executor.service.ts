import { Injectable, Logger } from '@nestjs/common';
import { ToolExecutionResult } from '../interfaces/tool.interface';
import { ToolsRegistry } from '../tools/tools.registry';

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(private readonly toolsRegistry: ToolsRegistry) {}

  async executeToolCall(
    toolName: string,
    parameters: Record<string, any>,
    context: { userId: number; conversationId: number },
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Executing tool: ${toolName}`, parameters);
      const executor = this.toolsRegistry.getExecutor(toolName);
      if (!executor) {
        throw new Error(`No executor found for tool: ${toolName}`);
      }

      return await executor.execute({
        userId: context.userId,
        conversationId: context.conversationId,
        parameters,
      });
    } catch (error) {
      this.logger.error(`Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error executing tool',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }
}
