export interface ChatHistory {
    query: string;
    answer: string;
    sources: string[];
    created_at: string;
}

export interface Conversation {
    conversationId: string;
    lastMessage: string;
    lastMessageTime: Date;
    messageCount: number;
}

export interface ChatRequest {
    query: string;
    conversationId: string | null;
    userId: string | null;
}

export interface ChatResponse {
    answer: string;
    sources: string[];
    conversationId: string;
}
