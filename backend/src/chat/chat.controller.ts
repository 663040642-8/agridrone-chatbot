import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}
  @Post()
  async chat(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    return await this.chatService.chat(dto);
  }

  @Get('conversations/:userId')
  async getUserConversations(@Param('userId') userId: string) {
    return await this.chatService.getUserConversations(userId);
  }

  @Get('history/:userId/:conversationId')
  async getConversationHistory(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return await this.chatService.getConversationHistory(userId, conversationId);
  }

  @Delete('conversation/:userId/:conversationId')
  async deleteConversation(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    await this.chatService.deleteConversation(userId, conversationId);
    return { message: 'Conversation deleted' };
  }
}