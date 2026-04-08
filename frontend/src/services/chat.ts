import api from './api';
import { ENDPOINTS } from '@/config/api';

export interface Citation {
  chunkId: string;
  content: string;
  documentId: string | null;
  score: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  knowledgeBaseIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  title?: string;
  knowledgeBaseIds?: string[];
}

export interface SendMessageRequest {
  content: string;
}

export interface StreamChunk {
  type: 'citation' | 'content' | 'done';
  data: unknown;
}

export const chatService = {
  async listConversations(): Promise<Conversation[]> {
    const response = await api.get(ENDPOINTS.chat.conversations);
    return response.data;
  },

  async createConversation(data: CreateConversationRequest = {}): Promise<Conversation> {
    const response = await api.post(ENDPOINTS.chat.create, data);
    return response.data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const response = await api.get(ENDPOINTS.chat.get(id));
    return response.data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await api.get(ENDPOINTS.chat.messages(conversationId));
    return response.data;
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await api.post(ENDPOINTS.chat.send(conversationId), { content });
    return response.data;
  },

  async sendMessageStream(
    conversationId: string,
    content: string,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const baseURL = api.defaults.baseURL || '';
    const token = localStorage.getItem('accessToken');
    const url = `${baseURL}${ENDPOINTS.chat.stream(conversationId)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to send message');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === '[DONE]') {
          onChunk({ type: 'done', data: null });
          continue;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          onChunk(parsed);
        } catch {
          // skip malformed JSON
        }
      }
    }
  },

  async updateConversation(id: string, title: string): Promise<Conversation> {
    const response = await api.put(ENDPOINTS.chat.update(id), { title });
    return response.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(ENDPOINTS.chat.delete(id));
  },
};
