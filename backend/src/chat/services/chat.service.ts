import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantService } from './qdrant.service';
import { MemoryService } from './memory.service';
import { SupabaseService } from '../../database/supabase.service';
import { ChatRequestDto, ChatResponseDto, ConversationDto } from '../dto/chat.dto';
import { ChatHistory } from '../interfaces/chat-history.interface';

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;
  private readonly EMBEDDING_MODEL = 'text-embedding-004';
  private readonly GENERATE_MODEL = 'gemini-2.5-flash';

  constructor(
    private qdrantService: QdrantService,
    private memoryService: MemoryService,
    private supabaseService: SupabaseService,
  ) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('Missing GOOGLE_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat(dto: ChatRequestDto): Promise<ChatResponseDto> {
    let conversationContext = this.memoryService.getRecentContext(dto.conversationId);
    if (!conversationContext && dto.userId) {
      conversationContext = await this.loadFromDB(dto.userId, dto.conversationId);
    }

    const searchQuery = conversationContext
      ? await this.rewriteQuery(dto.query, conversationContext)
      : dto.query;
    const queryVector = await this.getEmbedding(searchQuery);
    const searchResults = await this.qdrantService.search(queryVector, 5);

    if (searchResults.length === 0) {
      const answer = 'ไม่พบข้อมูลที่เกี่ยวข้องในฐานความรู้';
      this.saveTurn(dto.conversationId, dto.userId, dto.query, answer, []);
      return { answer, sources: [], conversationId: dto.conversationId };
    }

    const context = searchResults
      .map((r, i) => {
        const p = r.payload as any;
        return `[เอกสาร ${i + 1}]\nแหล่งที่มา: ${p.source}\n${p.content}`;
      })
      .join('\n---\n');

    const prompt = this.buildPrompt(dto.query, context, conversationContext);
    const answer = await this.generateAnswer(prompt);
    const sources = [...new Set(searchResults.map((r: any) => r.payload.source))];

    await this.saveTurn(dto.conversationId, dto.userId, dto.query, answer, sources);

    return { answer, sources, conversationId: dto.conversationId };
  }

  private async saveTurn(
    conversationId: string,
    userId: string | undefined,
    query: string,
    answer: string,
    sources: string[],
  ) {
    this.memoryService.addTurn(conversationId, query, answer);

    if (userId) {
      const supabase = this.supabaseService.getClient();
      await supabase.from('chat_history').insert({
        user_id: userId,
        conversation_id: conversationId,
        query,
        answer,
        sources,
      });
    }
  }

  private async loadFromDB(userId: string, conversationId: string): Promise<string> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error || !data || data.length === 0) return '';

    data.reverse().forEach((h: ChatHistory) => {
      this.memoryService.addTurn(conversationId, h.query, h.answer);
    });

    return data
      .map((h: ChatHistory) => `Q: ${h.query}\nA: ${h.answer.substring(0, 200)}...`)
      .join('\n\n');
  }

  private async rewriteQuery(query: string, context: string): Promise<string> {
    const prompt = `บริบทการสนทนา:\n${context}\n\nคำถามใหม่: ${query}\n\nเขียนคำถามใหม่ให้มีข้อมูลครบถ้วน:`;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.GENERATE_MODEL });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 100 },
      });
      return result.response.text().trim();
    } catch {
      return query;
    }
  }

  private buildPrompt(query: string, context: string, conversationContext: string): string {
    return `คุณคือผู้เชี่ยวชาญด้านโดรนเกษตรและสารเคมีกำจัดศัตรูพืช
      ใช้ข้อมูลจาก [ฐานความรู้] เท่านั้นในการตอบ
      หากข้อมูลไม่เพียงพอ ให้ตอบว่า "ไม่พบข้อมูลที่เกี่ยวข้อง"

      [บริบทการสนทนา]
      ${conversationContext}

      [คำถาม]
      ${query}

      [ข้อมูลจากฐานความรู้]
      ${context}

      ตอบเป็นภาษาไทย:
      - กระชับและชัดเจน
      - ใช้ bullet point ถ้าเหมาะสม
    `;
  }

  private async generateAnswer(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.GENERATE_MODEL });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
    });
    return result.response.text();
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.EMBEDDING_MODEL });

      const result = await model.embedContent({
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_QUERY',
      } as any);

      return result.embedding.values;
    } catch (e) {
      console.error('❌ Embedding failed:', {
        error: e.message,
        stack: e.stack,
        model: this.EMBEDDING_MODEL,
        textLength: text.length,
      });
      throw new Error(`Failed to generate embedding: ${e.message}`);
    }
  }

  async getUserConversations(userId: string): Promise<ConversationDto[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chat_history')
      .select('conversation_id, query, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const conversationMap = new Map<string, ConversationDto>();

    for (const row of data) {
      if (!conversationMap.has(row.conversation_id)) {
        conversationMap.set(row.conversation_id, {
          conversationId: row.conversation_id,
          lastMessage: row.query,
          lastMessageTime: new Date(row.created_at),
          messageCount: 1,
        });
      } else {
        const conv = conversationMap.get(row.conversation_id)!;
        conv.messageCount++;
      }
    }

    return Array.from(conversationMap.values());
  }

  async getConversationHistory(userId: string, conversationId: string): Promise<ChatHistory[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  }

  async deleteConversation(userId: string, conversationId: string) {
    const supabase = this.supabaseService.getClient();

    await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId)
      .eq('conversation_id', conversationId);

    this.memoryService.clearConversation(conversationId);
  }
}