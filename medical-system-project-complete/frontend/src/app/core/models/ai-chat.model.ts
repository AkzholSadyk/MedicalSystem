export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  messages: ChatMessage[];
}

export interface NewMessage {
  session_id: number | null;
  content: string;
}
