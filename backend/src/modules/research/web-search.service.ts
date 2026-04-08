import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);
  private readonly tavilyApiKey: string;
  private readonly serperApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.tavilyApiKey = this.configService.get<string>('TAVILY_API_KEY', '');
    this.serperApiKey = this.configService.get<string>('SERPER_API_KEY', '');
  }

  async search(query: string, maxResults = 5): Promise<SearchResult[]> {
    if (this.tavilyApiKey) {
      return this.searchWithTavily(query, maxResults);
    }
    if (this.serperApiKey) {
      return this.searchWithSerper(query, maxResults);
    }
    this.logger.warn('No search API configured');
    return [];
  }

  private async searchWithTavily(query: string, maxResults: number): Promise<SearchResult[]> {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.tavilyApiKey,
          query,
          search_depth: 'advanced',
          max_results: maxResults,
          include_answer: false,
        }),
      });

      if (!response.ok) throw new Error(`Tavily error: ${response.status}`);

      const data = await response.json();
      return (data.results || []).map((r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        source: 'tavily',
      }));
    } catch (error) {
      this.logger.error('Tavily search failed', error);
      return [];
    }
  }

  private async searchWithSerper(query: string, maxResults: number): Promise<SearchResult[]> {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.serperApiKey,
        },
        body: JSON.stringify({ q: query, num: maxResults }),
      });

      if (!response.ok) throw new Error(`Serper error: ${response.status}`);

      const data = await response.json();
      return (data.organic || []).map((r: { title: string; link: string; snippet: string }) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
        source: 'serper',
      }));
    } catch (error) {
      this.logger.error('Serper search failed', error);
      return [];
    }
  }
}
