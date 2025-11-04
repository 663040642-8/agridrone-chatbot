import { Injectable } from '@nestjs/common';

interface ConversationTurn {
  query: string;
  answer: string;
  timestamp: Date;
}

@Injectable()
export class MemoryService {
  private tempMemory = new Map<string, ConversationTurn[]>();
  private readonly MAX_TURNS = 3;

  addTurn(conversationId: string, query: string, answer: string) {
    if (!this.tempMemory.has(conversationId)) {
      this.tempMemory.set(conversationId, []);
    }

    const turns = this.tempMemory.get(conversationId)!;
    turns.push({ query, answer, timestamp: new Date() });

    if (turns.length > this.MAX_TURNS) {
      turns.shift();
    }
  }

  getRecentContext(conversationId: string): string {
    const turns = this.tempMemory.get(conversationId) || [];
    if (turns.length === 0) return '';

    return turns
      .map((t) => `Q: ${t.query}\nA: ${t.answer.substring(0, 200)}...`)
      .join('\n\n');
  }

  clearConversation(conversationId: string) {
    this.tempMemory.delete(conversationId);
  }

  cleanupOldConversations() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, turns] of this.tempMemory.entries()) {
      const lastTurn = turns[turns.length - 1];
      if (lastTurn.timestamp.getTime() < oneHourAgo) {
        this.tempMemory.delete(id);
      }
    }
  }
}
