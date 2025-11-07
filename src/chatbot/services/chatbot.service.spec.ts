import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from './chatbot.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { ConversationLog } from '../entities/conversation-log.entity';
import { ToolsRegistry } from '../tools/tools.registry';
import { ToolExecutorService } from './tool-executor.service';
import { AIModelManagerService } from './ai-model-manager.service';
import { ChatbotConfigService } from 'src/chatbot-config/chatbot-config.service';

describe('ChatbotService - getSystemPrompt', () => {
  let service: ChatbotService;
  let chatbotConfigService: jest.Mocked<ChatbotConfigService>;

  beforeEach(async () => {
    // Mock del ChatbotConfigService
    const mockChatbotConfigService = {
      getConfig: jest.fn(),
    };

    // Mocks básicos de repositorios
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ConversationLog),
          useValue: mockRepository,
        },
        {
          provide: ToolsRegistry,
          useValue: {
            getAllToolDefinitions: jest.fn(),
          },
        },
        {
          provide: ToolExecutorService,
          useValue: {
            executeToolCall: jest.fn(),
          },
        },
        {
          provide: AIModelManagerService,
          useValue: {
            getCurrentProvider: jest.fn(),
            getAllModels: jest.fn(),
            getHealthStatus: jest.fn(),
          },
        },
        {
          provide: ChatbotConfigService,
          useValue: mockChatbotConfigService,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    chatbotConfigService = module.get(ChatbotConfigService);
  });

  describe('getSystemPrompt', () => {
    it('should process template string with currentDate variable', async () => {
      // Arrange
      const mockTemplate = 'Hoy es {{currentDate}}. Eres un asistente.';
      chatbotConfigService.getConfig.mockResolvedValue({
        template: mockTemplate,
        sections: null,
        active_sections: [],
      });

      // Act
      const result = await service['getSystemPrompt']();

      // Assert
      expect(result.role).toBe('system');
      expect(result.content).toContain('Hoy es');
      expect(result.content).not.toContain('{{currentDate}}');
      expect(chatbotConfigService.getConfig).toHaveBeenCalledWith(
        'system_prompt',
      );
    });

    it('should combine active sections when template is an object', async () => {
      // Arrange
      const mockSections = {
        intro: 'Sección de introducción',
        rules: 'Sección de reglas',
        style: 'Sección de estilo',
      };

      chatbotConfigService.getConfig.mockResolvedValue({
        template: null,
        sections: mockSections,
        active_sections: ['intro', 'rules'],
      });

      // Act
      const result = await service['getSystemPrompt']();

      // Assert
      expect(result.role).toBe('system');
      expect(result.content).toContain('Sección de introducción');
      expect(result.content).toContain('Sección de reglas');
      expect(result.content).not.toContain('Sección de estilo');
    });

    it('should process sections object with currentDate replacement', async () => {
      // Arrange
      const mockSections = {
        intro: 'Hoy es {{currentDate}}',
        rules: 'Reglas del sistema',
      };

      chatbotConfigService.getConfig.mockResolvedValue({
        template: null,
        sections: mockSections,
        active_sections: ['intro', 'rules'],
      });

      // Act
      const result = await service['getSystemPrompt']();

      // Assert
      expect(result.role).toBe('system');
      expect(result.content).not.toContain('{{currentDate}}');
      expect(result.content).toContain('Hoy es');
    });

    it('should handle empty active_sections array', async () => {
      // Arrange
      const mockSections = {
        intro: 'Sección de introducción',
        rules: 'Sección de reglas',
      };

      chatbotConfigService.getConfig.mockResolvedValue({
        template: null,
        sections: mockSections,
        active_sections: [],
      });

      // Act
      const result = await service['getSystemPrompt']();

      // Assert
      expect(result.role).toBe('system');
      expect(result.content).toBe(''); // Sin secciones activas
    });

    it('should prioritize template over sections', async () => {
      // Arrange
      chatbotConfigService.getConfig.mockResolvedValue({
        template: 'Template directo',
        sections: {
          intro: 'Esta sección no debería aparecer',
        },
        active_sections: ['intro'],
      });

      // Act
      const result = await service['getSystemPrompt']();

      // Assert
      expect(result.content).toBe('Template directo');
      expect(result.content).not.toContain('Esta sección no debería aparecer');
    });

    it('should handle missing sections gracefully', async () => {
      // Arrange
      chatbotConfigService.getConfig.mockResolvedValue({
        template: null,
        sections: {
          intro: 'Intro',
        },
        active_sections: ['intro', 'nonexistent'], // Una sección que no existe
      });

      // Act
      const result = await service['getSystemPrompt']();

      // Assert
      expect(result.role).toBe('system');
      expect(result.content).toContain('Intro');
      // Debería manejar la sección inexistente sin fallar
    });

    it('should format date in Spanish locale', async () => {
      // Arrange
      chatbotConfigService.getConfig.mockResolvedValue({
        template: '{{currentDate}}',
        sections: null,
        active_sections: [],
      });

      // Act
      const result = await service['getSystemPrompt']();

      // Assert
      // Verificar que la fecha está en español (días y meses)
      const spanishMonths = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const hasSpanishMonth = spanishMonths.some((month) =>
        result.content.toLowerCase().includes(month),
      );
      expect(hasSpanishMonth).toBe(true);
    });

    it('should throw error when config service fails', async () => {
      // Arrange
      chatbotConfigService.getConfig.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(service['getSystemPrompt']()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
