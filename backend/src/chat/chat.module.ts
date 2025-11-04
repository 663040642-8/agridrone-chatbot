import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './services/chat.service';
import { MemoryService } from './services/memory.service';
import { QdrantService } from './services/qdrant.service';
import { SupabaseService } from '../database/supabase.service';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService, 
    MemoryService, 
    QdrantService,
    SupabaseService
  ],
})
export class ChatModule {}