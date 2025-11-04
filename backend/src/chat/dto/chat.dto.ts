import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsOptional()
  userId?: string; 
}

export class ChatResponseDto {
  answer: string;
  sources: string[];
  conversationId: string;
}

export class ConversationDto {
  conversationId: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
}