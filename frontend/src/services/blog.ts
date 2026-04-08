import api, { type PaginatedResponse } from './api';
import { ENDPOINTS } from '@/config/api';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  authorName: string;
  authorAvatar: string | null;
  readTime: number;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  totalRatings?: number;
}

export interface BlogCategory {
  category: string;
  count: number;
}

export interface BlogRatingAggregate {
  averageRating: number;
  totalRatings: number;
  userRating: number | null;
  distribution: Record<number, number>;
}

export interface BlogComment {
  id: string;
  blogPostId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  createdAt: string;
}

export const blogService = {
  async list(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<BlogPost>> {
    const response = await api.get(ENDPOINTS.blog.list, { params });
    return response.data;
  },

  async getBySlug(slug: string): Promise<BlogPost> {
    const response = await api.get(ENDPOINTS.blog.get(slug));
    return response.data;
  },

  async getCategories(): Promise<BlogCategory[]> {
    const response = await api.get(ENDPOINTS.blog.categories);
    return response.data;
  },

  async getRelated(slug: string, limit = 3): Promise<BlogPost[]> {
    const response = await api.get(ENDPOINTS.blog.related(slug), {
      params: { limit },
    });
    return response.data;
  },

  async getRating(postId: string): Promise<BlogRatingAggregate> {
    const response = await api.get(ENDPOINTS.blog.rating(postId));
    return response.data;
  },

  async rateBlogPost(
    postId: string,
    rating: number,
  ): Promise<BlogRatingAggregate> {
    const response = await api.post(ENDPOINTS.blog.rate(postId), { rating });
    return response.data;
  },

  async getComments(
    postId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<BlogComment>> {
    const response = await api.get(ENDPOINTS.blog.comments(postId), {
      params: { page, limit },
    });
    return response.data;
  },

  async createComment(postId: string, content: string): Promise<BlogComment> {
    const response = await api.post(ENDPOINTS.blog.addComment(postId), {
      content,
    });
    return response.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(ENDPOINTS.blog.deleteComment(commentId));
  },
};
