import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { Navbar } from "../navbar/navbar";
import { Sidebar } from "../sidebar/sidebar";
import { AuthService } from '../../core/auth/auth-service';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../features/chat/chat.model';
import { ChatStateService } from '../../core/services/chat-state-service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Sidebar, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  authService = inject(AuthService);
  private chatStateService = inject(ChatStateService);
  isSidebarCollapsed = true;

  conversations$ = this.chatStateService.conversations$;
  selectedConversationId$ = this.chatStateService.selectedConversationId$;
  isLoading$ = this.chatStateService.isLoading$;

  ngOnInit(): void {
    if (window.innerWidth >= 768) {
      this.isSidebarCollapsed = false;
    }
  }
  onNewChatClick(): void {
    this.chatStateService.newChatClick$.next();
  }

  onConversationSelect(conversationId: string): void {
    this.chatStateService.updateSelectedConversationId(conversationId);
    this.chatStateService.conversationSelect$.next(conversationId);
  }

  onConversationDelete(conversationId: string): void {
    this.chatStateService.conversationDelete$.next(conversationId);
  }

  onMobileSidebarToggle(): void {
    this.chatStateService.emitMobileSidebarToggle();
  }
}
