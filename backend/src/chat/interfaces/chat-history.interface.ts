export interface ChatHistory {
  id: string;
  user_id: string;
  conversation_id: string;
  query: string;
  answer: string;
  sources: string[];
  created_at: string;
}