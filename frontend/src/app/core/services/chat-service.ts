import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ChatRequest, ChatResponse, Conversation, ChatHistory } from '../../features/chat/chat.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly API_URL = `${environment.apiUrl}/chat`;
  http = inject(HttpClient);
  sendMessage(payload: ChatRequest): Promise<ChatResponse> {
    return firstValueFrom(this.http.post<ChatResponse>(this.API_URL, payload));
  }

  fetchConversations(userId: string): Promise<Conversation[]> {
    return firstValueFrom(this.http.get<Conversation[]>(`${this.API_URL}/conversations/${userId}`));
  }

  getConversationHistory(userId: string, conversationId: string): Promise<ChatHistory[]> {
    return firstValueFrom(this.http.get<ChatHistory[]>(`${this.API_URL}/history/${userId}/${conversationId}`));
  }

  deleteConversation(userId: string, conversationId: string): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.API_URL}/conversation/${userId}/${conversationId}`));
  }
}
