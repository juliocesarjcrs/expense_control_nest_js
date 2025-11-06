import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotConfiguration } from './entities/chatbot-configuration.entity';
import { ChatbotConfigHistory } from './entities/chatbot-config-history.entity';
import { ChatbotConfigService } from './chatbot-config.service';
import { ChatbotConfigController } from './chatbot-config.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatbotConfiguration, ChatbotConfigHistory]),
  ],
  controllers: [ChatbotConfigController],
  providers: [ChatbotConfigService],
  exports: [ChatbotConfigService],
})
export class ChatbotConfigModule {}
