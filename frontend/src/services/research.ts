import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';

export interface ResearchSource {
  type: 'knowledge_base' | 'web';
  title: string;
  url?: string;
  content: string;
  relevanceScore: number;
}

export interface ResearchOutlineSection {
  heading: string;
  content: string;
  keyPoints: string[];
  sources: number[];
}

export interface ResearchOutline {
  title: string;
  executiveSummary: string;
  sections: ResearchOutlineSection[];
}

export interface ResearchSettings {
  sourceTypes?: string[];
  outputFormat?: 'detailed' | 'summary' | 'bullets';
  includeWebSearch?: boolean;
}

export interface ResearchSession {
  id: string;
  userId: string;
  query: string;
  knowledgeBaseIds: string[];
  status: 'pending' | 'planning' | 'researching' | 'synthesizing' | 'completed' | 'failed';
  sources: ResearchSource[];
  synthesis: string | null;
  outline: ResearchOutline | null;
  depth: 'quick' | 'standard' | 'comprehensive';
  settings: ResearchSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResearchRequest {
  query: string;
  knowledgeBaseIds?: string[];
  depth?: 'quick' | 'standard' | 'comprehensive';
  sourceTypes?: string[];
  outputFormat?: 'detailed' | 'summary' | 'bullets';
}

export const researchService = {
  async list(): Promise<ResearchSession[]> {
    const res = await api.get(ENDPOINTS.research.list);
    return res.data;
  },

  async get(id: string): Promise<ResearchSession> {
    const res = await api.get(ENDPOINTS.research.get(id));
    return res.data;
  },

  async create(data: CreateResearchRequest): Promise<ResearchSession> {
    const res = await api.post(ENDPOINTS.research.create, data);
    return res.data;
  },

  async start(id: string, includeWebSearch = true): Promise<ResearchSession> {
    const res = await api.post(ENDPOINTS.research.start(id), { includeWebSearch });
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(ENDPOINTS.research.delete(id));
  },
};
