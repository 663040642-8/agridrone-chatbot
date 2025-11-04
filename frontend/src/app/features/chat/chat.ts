import { AfterViewChecked, ChangeDetectorRef, Component, computed, effect, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ChatService } from '../../core/services/chat-service';
import { ChatHistory, ChatRequest, ChatResponse, Conversation } from './chat.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth-service';
import { Navbar } from "../../layouts/navbar/navbar";
import { ChatStateService } from '../../core/services/chat-state-service';

@Component({
  selector: 'app-chat',
  imports: [ReactiveFormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  private cdr = inject(ChangeDetectorRef);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private chatStateService = inject(ChatStateService);

  newMessageText = new FormControl('');

  conversations: Conversation[] = this.chatStateService.conversations$.value;
  currentChatHistory: ChatHistory[] = [];
  isCreatingNewChat: boolean = false;

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  userId = computed(() => this.authService.user()?.id);
  isGuest = computed(() => !this.userId());

  constructor() {
    this.chatStateService.conversations$.subscribe(convos => {
      this.conversations = convos;
    });
    effect(() => {
      const currentUserId = this.userId();

      if (currentUserId) {
        this.fetchConversations();
      } else {
        this.chatStateService.updateConversations([]);
        this.currentChatHistory = [];
        this.chatStateService.updateSelectedConversationId(null);
        this.startNewChat();
      }
    });
    this.chatStateService.newChatClick$.subscribe(() => this.handleNewChat());
    this.chatStateService.conversationSelect$.subscribe(id => this.handleConversationSelect(id));
    this.chatStateService.conversationDelete$.subscribe(id => this.handleConversationDelete(id));
  }

  private scrollToBottom(): void {
    if (this.messageContainer) {
      this.cdr.detectChanges();

      setTimeout(() => {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }, 0);
    }
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  handleEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  handleNewChat(): void {
    this.startNewChat();
  }

  handleConversationSelect(conversationId: string): void {
    this.selectConversation(conversationId);
  }

  async handleConversationDelete(conversationId: string): Promise<void> {
    if (!confirm('คุณแน่ใจว่าต้องการลบการสนทนานี้?')) return;

    const currentUserId = this.userId();
    if (!currentUserId) return;

    try {
      await this.chatService.deleteConversation(currentUserId, conversationId);

      const updatedConversations = this.conversations.filter(
        c => c.conversationId !== conversationId
      );
      this.chatStateService.updateConversations(updatedConversations);

      if (this.chatStateService.getCurrentConversationId() === conversationId) {
        this.chatStateService.updateSelectedConversationId(null);
        this.currentChatHistory = [];
        if (updatedConversations.length > 0) {
          this.selectConversation(updatedConversations[0].conversationId);
        } else {
          this.startNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  startNewChat(): void {
    const newConversationId = this.generateUUID();
    this.chatStateService.updateSelectedConversationId(newConversationId);
    this.currentChatHistory = [];
    this.newMessageText.reset();
    this.isCreatingNewChat = true;
  }

  async fetchConversations(): Promise<void> {
    const currentUserId = this.userId();
    if (!currentUserId) return;

    this.chatStateService.updateIsLoading(true);
    try {
      const convos = await this.chatService.fetchConversations(currentUserId);
      this.chatStateService.updateConversations(convos);

      if (!this.chatStateService.getCurrentConversationId()) {
        this.startNewChat();
      } else {
        this.getConversationHistory(this.chatStateService.getCurrentConversationId()!);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      this.chatStateService.updateIsLoading(false);
    }
  }

  selectConversation(conversationId: string): void {
    this.isCreatingNewChat = false;
    this.chatStateService.updateSelectedConversationId(conversationId);
    this.getConversationHistory(conversationId);
  }

  async getConversationHistory(conversationId: string): Promise<void> {
    const currentUserId = this.userId();
    if (!currentUserId) return;

    this.chatStateService.updateIsLoading(true);
    this.currentChatHistory = [];
    try {
      this.currentChatHistory = await this.chatService.getConversationHistory(
        currentUserId,
        conversationId
      );
      this.scrollToBottom();
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      this.chatStateService.updateIsLoading(false);
    }
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessageText.value?.trim() || '';
    if (!text) return;

    const selectedId = this.chatStateService.getCurrentConversationId();
    if (!selectedId) {
      this.startNewChat();
    }

    const isNewConversation = this.isCreatingNewChat;
    const currentUserId = this.userId();

    this.newMessageText.disable();

    const userQueryHistory: ChatHistory = {
      query: text,
      answer: '',
      sources: [],
      created_at: new Date().toISOString()
    };
    this.currentChatHistory.push(userQueryHistory);
    this.scrollToBottom();
    this.newMessageText.reset();
    this.newMessageText.enable();
    const payload: ChatRequest = {
      query: text,
      conversationId: this.chatStateService.getCurrentConversationId()!,
      userId: currentUserId || null
    };

    try {
      const response: ChatResponse = await this.chatService.sendMessage(payload);
      const lastItem = this.currentChatHistory[this.currentChatHistory.length - 1];
      if (lastItem.query === text) {
        lastItem.answer = response.answer;
        lastItem.sources = response.sources;
      }

      if (currentUserId) {
        if (isNewConversation) {
          const actualConversationId = response.conversationId || this.chatStateService.getCurrentConversationId()!;

          if (actualConversationId !== this.chatStateService.getCurrentConversationId()) {
            this.chatStateService.updateSelectedConversationId(actualConversationId);
          }

          const newConversation: Conversation = {
            conversationId: actualConversationId,
            lastMessage: text,
            lastMessageTime: new Date(),
            messageCount: 1
          };
          this.chatStateService.updateConversations([newConversation, ...this.conversations]);
          this.conversations = [newConversation, ...this.conversations];

          this.isCreatingNewChat = false;
        } else {
          const convo = this.conversations.find(
            c => c.conversationId === this.chatStateService.getCurrentConversationId()
          );
          if (convo) {
            convo.lastMessage = text;
            convo.lastMessageTime = new Date();
            convo.messageCount++;
          }
          this.chatStateService.updateConversations([...this.conversations]);
        }
      }
      this.scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      this.currentChatHistory.pop();
    } finally {
      this.newMessageText.enable();
    }
  }
}