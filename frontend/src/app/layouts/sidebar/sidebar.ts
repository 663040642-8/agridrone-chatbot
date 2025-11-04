import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Conversation } from '../../features/chat/chat.model';
import { CommonModule, SlicePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth-service';

@Component({
  selector: 'app-sidebar',
  imports: [SlicePipe, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Input() conversations: Conversation[] | null = [];
  @Input() selectedConversationId: string | null = null;
  @Input() isLoading: boolean | null = false;
  @Input() isCollapsed: boolean = false;
  
  @Output() newChatClick = new EventEmitter<void>();
  @Output() conversationSelect = new EventEmitter<string>();
  @Output() conversationDelete = new EventEmitter<string>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  authService = inject(AuthService);

  onNewChat(): void {
    this.newChatClick.emit();
  }

  onSelectConversation(conversationId: string): void {
    this.conversationSelect.emit(conversationId);
  }

  onDeleteConversation(event: Event, conversationId: string): void {
    event.stopPropagation();
    this.conversationDelete.emit(conversationId);
  }

  toggleSidebar() {
    this.collapsedChange.emit(!this.isCollapsed);
  }
}
