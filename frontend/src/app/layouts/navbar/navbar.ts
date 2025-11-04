import { Component, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { AuthService } from '../../core/auth/auth-service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatStateService } from '../../core/services/chat-state-service';
import { Conversation } from '../../features/chat/chat.model';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  authService = inject(AuthService);
  private chatStateService = inject(ChatStateService);

  @Input() isLoggedIn: boolean = false;
  @Input() conversations: Conversation[] | null = [];
  @Input() isLoading: boolean | null = false;
  @Input() selectedConversationId: string | null = null;
  @Input() isMenuOpen: boolean = false;

  @Output() newChatClick = new EventEmitter<void>();
  @Output() conversationSelect = new EventEmitter<string>();
  @Output() conversationDelete = new EventEmitter<string>();
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onDeleteConversation(event: Event, conversationId: string): void {
    event.stopPropagation();
    this.conversationDelete.emit(conversationId);
  }

  onSelectConversation(conversationId: string): void {
    this.conversationSelect.emit(conversationId);
    this.toggleMobileMenu();
  }

  onNewChat(): void {
    this.newChatClick.emit();
    this.toggleMobileMenu();
  }

  onSignOut(): void {
    this.authService.signOut();
    this.toggleMobileMenu();
  }
}
