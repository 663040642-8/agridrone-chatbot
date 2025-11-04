import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Conversation } from '../../features/chat/chat.model';

@Injectable({
  providedIn: 'root',
})
export class ChatStateService {
  public conversations$ = new BehaviorSubject<Conversation[]>([]);
  public selectedConversationId$ = new BehaviorSubject<string | null>(null);
  public isLoading$ = new BehaviorSubject<boolean>(false);

  public newChatClick$ = new Subject<void>();
  public conversationSelect$ = new Subject<string>();
  public conversationDelete$ = new Subject<string>();
  public mobileSidebarToggle$ = new Subject<void>();

  updateConversations(conversations: Conversation[]): void {
    this.conversations$.next(conversations);
  }

  updateSelectedConversationId(id: string | null): void {
    this.selectedConversationId$.next(id);
  }

  updateIsLoading(loading: boolean): void {
    this.isLoading$.next(loading);
  }

  getCurrentConversationId(): string | null {
    return this.selectedConversationId$.value;
  }

  emitMobileSidebarToggle(): void {
    this.mobileSidebarToggle$.next();
  }
}
