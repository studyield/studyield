import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

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
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  averageRating?: number;
  totalRatings?: number;
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
  createdAt: Date;
}

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(private readonly db: DatabaseService) {}

  async findAll(
    page = 1,
    limit = 12,
    category?: string,
    search?: string,
  ): Promise<{ data: BlogPost[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['is_published = true'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      conditions.push(`category = $${paramIndex++}`);
      params.push(category);
    }

    if (search) {
      conditions.push(`(title ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [results, countResult] = await Promise.all([
      this.db.queryMany<Record<string, unknown>>(
        `SELECT bp.*,
                COALESCE(ra.avg_rating, 0) as avg_rating,
                COALESCE(ra.total_ratings, 0) as total_ratings
         FROM blog_posts bp
         LEFT JOIN (
           SELECT blog_post_id,
                  ROUND(AVG(rating)::numeric, 1) as avg_rating,
                  COUNT(*) as total_ratings
           FROM blog_ratings GROUP BY blog_post_id
         ) ra ON ra.blog_post_id = bp.id
         ${where} ORDER BY bp.published_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...params, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM blog_posts ${where}`,
        params,
      ),
    ]);

    return {
      data: results.map((r) => this.mapBlogPost(r)),
      total: parseInt(countResult?.count || '0', 10),
    };
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const result = await this.db.queryOne<Record<string, unknown>>(
      'SELECT * FROM blog_posts WHERE slug = $1 AND is_published = true',
      [slug],
    );

    if (!result) {
      throw new NotFoundException('Blog post not found');
    }

    return this.mapBlogPost(result);
  }

  async findCategories(): Promise<{ category: string; count: number }[]> {
    const results = await this.db.queryMany<{ category: string; count: string }>(
      `SELECT category, COUNT(*) as count FROM blog_posts WHERE is_published = true GROUP BY category ORDER BY count DESC`,
    );

    return results.map((r) => ({
      category: r.category,
      count: parseInt(r.count, 10),
    }));
  }

  async findRelated(slug: string, limit = 3): Promise<BlogPost[]> {
    const post = await this.findBySlug(slug);

    const results = await this.db.queryMany<Record<string, unknown>>(
      `SELECT * FROM blog_posts
       WHERE is_published = true AND slug != $1 AND category = $2
       ORDER BY published_at DESC LIMIT $3`,
      [slug, post.category, limit],
    );

    return results.map((r) => this.mapBlogPost(r));
  }

  // --- Ratings ---

  async getRatingAggregate(postId: string, userId?: string): Promise<BlogRatingAggregate> {
    const [agg, distRows] = await Promise.all([
      this.db.queryOne<{
        avg_rating: string;
        total_ratings: string;
      }>(
        `SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as avg_rating,
                COUNT(*) as total_ratings
         FROM blog_ratings WHERE blog_post_id = $1`,
        [postId],
      ),
      this.db.queryMany<{ rating: number; count: string }>(
        `SELECT rating, COUNT(*) as count FROM blog_ratings
         WHERE blog_post_id = $1 GROUP BY rating`,
        [postId],
      ),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distRows) {
      distribution[row.rating] = parseInt(row.count, 10);
    }

    let userRating: number | null = null;
    if (userId) {
      const ur = await this.db.queryOne<{ rating: number }>(
        `SELECT rating FROM blog_ratings WHERE blog_post_id = $1 AND user_id = $2`,
        [postId, userId],
      );
      userRating = ur?.rating ?? null;
    }

    return {
      averageRating: parseFloat(agg?.avg_rating || '0'),
      totalRatings: parseInt(agg?.total_ratings || '0', 10),
      userRating,
      distribution,
    };
  }

  async upsertRating(postId: string, userId: string, rating: number): Promise<BlogRatingAggregate> {
    await this.db.query(
      `INSERT INTO blog_ratings (blog_post_id, user_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (blog_post_id, user_id) DO UPDATE SET rating = $3, updated_at = NOW()`,
      [postId, userId, rating],
    );

    return this.getRatingAggregate(postId, userId);
  }

  // --- Comments ---

  async getComments(
    postId: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: BlogComment[]; total: number }> {
    const offset = (page - 1) * limit;

    const [results, countResult] = await Promise.all([
      this.db.queryMany<Record<string, unknown>>(
        `SELECT bc.*, u.name as user_name, u.avatar_url as user_avatar
         FROM blog_comments bc
         JOIN users u ON u.id = bc.user_id
         WHERE bc.blog_post_id = $1
         ORDER BY bc.created_at DESC
         LIMIT $2 OFFSET $3`,
        [postId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM blog_comments WHERE blog_post_id = $1`,
        [postId],
      ),
    ]);

    return {
      data: results.map((r) => this.mapBlogComment(r)),
      total: parseInt(countResult?.count || '0', 10),
    };
  }

  async createComment(postId: string, userId: string, content: string): Promise<BlogComment> {
    const result = await this.db.queryOne<Record<string, unknown>>(
      `WITH inserted AS (
         INSERT INTO blog_comments (blog_post_id, user_id, content)
         VALUES ($1, $2, $3) RETURNING *
       )
       SELECT inserted.*, u.name as user_name, u.avatar_url as user_avatar
       FROM inserted JOIN users u ON u.id = inserted.user_id`,
      [postId, userId, content],
    );

    return this.mapBlogComment(result!);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.db.queryOne<{ user_id: string }>(
      `SELECT user_id FROM blog_comments WHERE id = $1`,
      [commentId],
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.db.query(`DELETE FROM blog_comments WHERE id = $1`, [commentId]);
  }

  private mapBlogComment(row: Record<string, unknown>): BlogComment {
    return {
      id: row.id as string,
      blogPostId: row.blog_post_id as string,
      userId: row.user_id as string,
      userName: row.user_name as string,
      userAvatar: (row.user_avatar as string) || null,
      content: row.content as string,
      createdAt: new Date(row.created_at as string),
    };
  }

  private mapBlogPost(row: Record<string, unknown>): BlogPost {
    return {
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      excerpt: row.excerpt as string,
      content: row.content as string,
      coverImage: (row.cover_image as string) || null,
      category: row.category as string,
      tags: (row.tags as string[]) || [],
      authorName: row.author_name as string,
      authorAvatar: (row.author_avatar as string) || null,
      readTime: row.read_time as number,
      isPublished: row.is_published as boolean,
      publishedAt: new Date(row.published_at as string),
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      averageRating:
        row.avg_rating !== undefined ? parseFloat(row.avg_rating as string) : undefined,
      totalRatings:
        row.total_ratings !== undefined ? parseInt(row.total_ratings as string, 10) : undefined,
    };
  }
}
