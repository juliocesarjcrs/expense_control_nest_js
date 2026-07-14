import { Test } from '@nestjs/testing';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { AIModelManagerService } from 'src/chatbot/services/ai-model-manager.service';

export const setupTestApp = async (): Promise<INestApplication> => {
  const mod = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AIModelManagerService)
    .useValue({
      onModuleInit: async () => {},
      onModuleDestroy: async () => {},
      initialize: async () => {},
      loadModelsFromDatabase: async () => {},
      selectBestProvider: async () => null,
      getCurrentProvider: async () => null,
      switchToNextProvider: async () => {},
    })
    .compile();

  const app = mod.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  return app;
};
