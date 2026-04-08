import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { Public, CurrentUser, JwtPayload } from '../../common';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all published blog posts' })
  @ApiResponse({ status: 200, description: 'Blog posts list' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const { data, total } = await this.blogService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
      category,
      search,
    );

    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 12;

    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get blog categories with post counts' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories() {
    return this.blogService.findCategories();
  }

  // Delete comment must be before :slug to avoid route conflict
  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete own comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  async deleteComment(@Param('commentId') commentId: string, @CurrentUser() user: JwtPayload) {
    await this.blogService.deleteComment(commentId, user.sub);
    return { success: true };
  }

  @Public()
  @Get(':postId/rating')
  @ApiOperation({ summary: 'Get rating aggregate for a blog post' })
  @ApiResponse({ status: 200, description: 'Rating aggregate' })
  async getRating(@Param('postId') postId: string) {
    return this.blogService.getRatingAggregate(postId);
  }

  @Post(':postId/rating')
  @ApiOperation({ summary: 'Rate a blog post' })
  @ApiResponse({ status: 200, description: 'Rating saved' })
  async ratePost(
    @Param('postId') postId: string,
    @Body() body: { rating: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.blogService.upsertRating(postId, user.sub, body.rating);
  }

  @Public()
  @Get(':postId/comments')
  @ApiOperation({ summary: 'Get comments for a blog post' })
  @ApiResponse({ status: 200, description: 'Comments list' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getComments(
    @Param('postId') postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.blogService.getComments(
      postId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );

    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;

    return {
      ...result,
      page: p,
      limit: l,
      totalPages: Math.ceil(result.total / l),
    };
  }

  @Post(':postId/comments')
  @ApiOperation({ summary: 'Add a comment to a blog post' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  async addComment(
    @Param('postId') postId: string,
    @Body() body: { content: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.blogService.createComment(postId, user.sub, body.content);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get blog post by slug' })
  @ApiResponse({ status: 200, description: 'Blog post' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Public()
  @Get(':slug/related')
  @ApiOperation({ summary: 'Get related blog posts' })
  @ApiResponse({ status: 200, description: 'Related posts' })
  async findRelated(@Param('slug') slug: string, @Query('limit') limit?: string) {
    return this.blogService.findRelated(slug, limit ? parseInt(limit, 10) : 3);
  }
}
