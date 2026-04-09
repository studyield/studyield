import { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  BookOpen,
  Brain,
  Sparkles,
  Lightbulb,
  Rocket,
  Share2,
  Check,
  Copy,
  X,
  Loader2,
  Star,
  Trash2,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  blogService,
  type BlogPost,
  type BlogRatingAggregate,
  type BlogComment,
} from '@/services/blog';

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'study-tips': { label: 'Study Tips', icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
  'ai-features': { label: 'AI Features', icon: Brain, color: 'from-violet-500 to-purple-500' },
  features: { label: 'Features', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
  productivity: { label: 'Productivity', icon: Rocket, color: 'from-pink-500 to-rose-500' },
  'getting-started': { label: 'Getting Started', icon: BookOpen, color: 'from-teal-500 to-emerald-500' },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderMarkdown(content: string) {
  // Simple markdown-to-HTML: headings, bold, italic, lists, tables, hr, links, code
  let result = content;
  result = result
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4 text-sm"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-bold mt-6 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-black mt-10 mb-4">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr class="my-8 border-border" />')
    .replace(/^- (.+)$/gm, '<li class="ml-6 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-6 list-decimal">$1</li>');

  result = result.replace(/((?:<li class="ml-6 list-disc">.*?<\/li>\n?)+)/g, '<ul class="my-4 space-y-1">$1</ul>');
  result = result.replace(/((?:<li class="ml-6 list-decimal">.*?<\/li>\n?)+)/g, '<ol class="my-4 space-y-1">$1</ol>');

  // Tables
  result = result.replace(/(\|.+\|[\n\r]?)+/g, (block) => {
    const rows = block.trim().split('\n').filter(row => !row.match(/^\|[\s-:|]+\|$/));
    if (rows.length === 0) return '';
    const tableRows = rows.map((row, i) => {
      const cells = row.split('|').filter(c => c.trim());
      const tag = i === 0 ? 'th' : 'td';
      const cls = i === 0 ? 'border border-border px-3 py-2 bg-muted font-semibold' : 'border border-border px-3 py-2';
      return `<tr>${cells.map(c => `<${tag} class="${cls}">${c.trim()}</${tag}>`).join('')}</tr>`;
    });
    return `<table class="w-full border-collapse border border-border my-6 text-sm">${tableRows.join('')}</table>`;
  });

  // Paragraphs
  result = result.replace(/^(?!<[a-z/]|$|\s*$)(.+)$/gm, '<p class="mb-4 leading-relaxed text-muted-foreground">$1</p>');

  return result;
}

function StarRating({
  rating,
  onRate,
  interactive = false,
  size = 'md',
}: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hovered, setHovered] = useState(0);
  const starSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive ? (hovered || rating) >= star : rating >= star;
        const halfFilled = !filled && !interactive && rating >= star - 0.5;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={cn(
              'transition-all',
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default',
            )}
          >
            <Star
              className={cn(
                starSize,
                'transition-colors',
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : halfFilled
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-transparent text-muted-foreground/30',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function formatCommentDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function RelatedCard({ post }: { post: BlogPost }) {
  const catMeta = CATEGORY_META[post.category] || { label: post.category, icon: BookOpen, color: 'from-green-500 to-emerald-500' };

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block bg-card border-2 border-border rounded-2xl overflow-hidden hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg transition-all"
    >
      <div className={cn('relative aspect-[16/9] bg-gradient-to-br', catMeta.color)}>
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <catMeta.icon className="w-12 h-12 text-white/20" />
          </div>
        )}
      </div>
      <div className="p-4">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r text-white mb-2', catMeta.color)}>
          {catMeta.label}
        </span>
        <h3 className="font-bold text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{post.readTime} min read</p>
      </div>
    </Link>
  );
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Rating state
  const [ratingData, setRatingData] = useState<BlogRatingAggregate | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [isEditingRating, setIsEditingRating] = useState(false);

  // Comments state
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const getShareUrl = () => window.location.href;

  const handleCopy = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchRating = useCallback(async (postId: string) => {
    try {
      const data = await blogService.getRating(postId);
      setRatingData(data);
      if (data.userRating) setPendingRating(data.userRating);
    } catch {
      // rating fetch failed silently
    }
  }, []);

  const fetchComments = useCallback(async (postId: string, page: number) => {
    setCommentsLoading(true);
    try {
      const res = await blogService.getComments(postId, page);
      if (page === 1) {
        setComments(res.data);
      } else {
        setComments((prev) => [...prev, ...res.data]);
      }
      setCommentsTotal(res.total);
      setCommentsTotalPages(res.totalPages);
    } catch {
      // comments fetch failed silently
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const handleSubmitRating = async () => {
    if (!post || !isAuthenticated || pendingRating === 0) return;
    setRatingLoading(true);
    try {
      const data = await blogService.rateBlogPost(post.id, pendingRating);
      setRatingData(data);
      setPendingRating(data.userRating ?? 0);
      setIsEditingRating(false);
    } catch {
      // rating failed
    } finally {
      setRatingLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!post || !newComment.trim() || !isAuthenticated) return;
    setSubmittingComment(true);
    try {
      const comment = await blogService.createComment(post.id, newComment.trim());
      setComments((prev) => [comment, ...prev]);
      setCommentsTotal((t) => t + 1);
      setNewComment('');
    } catch {
      // comment creation failed
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await blogService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsTotal((t) => t - 1);
    } catch {
      // delete failed
    }
  };

  const handleLoadMoreComments = () => {
    if (!post || commentsPage >= commentsTotalPages) return;
    const nextPage = commentsPage + 1;
    setCommentsPage(nextPage);
    fetchComments(post.id, nextPage);
  };

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const [postData, relatedData] = await Promise.all([
          blogService.getBySlug(slug),
          blogService.getRelated(slug),
        ]);
        setPost(postData);
        setRelated(relatedData);

        fetchRating(postData.id);
        fetchComments(postData.id, 1);
      } catch {
        navigate('/blog', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, navigate, fetchRating, fetchComments]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </PublicLayout>
    );
  }

  if (!post) return null;

  const catMeta = CATEGORY_META[post.category] || { label: post.category, icon: BookOpen, color: 'from-green-500 to-emerald-500' };
  const CatIcon = catMeta.icon;

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-green-50/50 via-background to-background dark:from-green-950/20 dark:via-background dark:to-background">
        {/* Cover Image */}
        {post.coverImage && (
          <section className="pt-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto"
              >
                <div className="relative aspect-[21/9] rounded-2xl overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Hero / Header */}
        <section className={cn('relative pb-12 overflow-hidden', post.coverImage ? 'pt-10' : 'pt-28')}>
          {!post.coverImage && (
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-20 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-20 w-64 h-64 bg-emerald-400 rounded-full blur-3xl" />
            </div>
          )}

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Breadcrumb */}
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Blog
                </Link>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r text-white', catMeta.color)}>
                    <CatIcon className="w-3.5 h-3.5" />
                    {catMeta.label}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime} min read
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5">
                  {post.title}
                </h1>

                {/* Excerpt */}
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {post.excerpt}
                </p>

                {/* Author & Share */}
                <div className="flex items-center justify-between border-b border-border pb-6">
                  <div className="flex items-center gap-3">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                        {post.authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{post.authorName}</p>
                      <p className="text-xs font-semibold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">Studyield</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShareModal(true)}
                    className="gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <article
                className="prose-custom text-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(post.content)) }}
              />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-border">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?search=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 bg-muted rounded-full text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
              {/* Ratings & Reviews — Deskive style */}
              <div className="mt-10 pt-8 border-t border-border">
                <h3 className="text-xl font-bold mb-6">Ratings & Reviews</h3>

                <div className="bg-card border border-border rounded-2xl p-6">
                  {/* Top row: Average + Distribution */}
                  {ratingData && (
                    <div className="flex gap-8 items-start mb-8">
                      {/* Average display */}
                      <div className="flex flex-col items-center shrink-0">
                        <span className="text-5xl font-black leading-none">
                          {ratingData.averageRating.toFixed(1)}
                        </span>
                        <div className="mt-2">
                          <StarRating rating={ratingData.averageRating} size="sm" />
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {ratingData.totalRatings} {ratingData.totalRatings === 1 ? 'rating' : 'ratings'}
                        </span>
                      </div>

                      {/* Distribution bars */}
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = ratingData.distribution[star] || 0;
                          const pct = ratingData.totalRatings > 0
                            ? (count / ratingData.totalRatings) * 100
                            : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                                {star} star
                              </span>
                              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className="h-full bg-amber-400 rounded-full"
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-5 shrink-0">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-border mb-6" />

                  {/* Rate this Post */}
                  {isAuthenticated ? (
                    ratingData?.userRating && !isEditingRating ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Your Rating</h4>
                          <div className="flex items-center gap-2">
                            <StarRating rating={ratingData.userRating} size="md" />
                            <span className="text-sm font-bold">
                              {ratingData.userRating}<span className="text-muted-foreground font-normal">/5</span>
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingRating(true)}
                        >
                          Edit
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Rate this Post</h4>
                        <div className="flex items-center gap-3 mb-4">
                          <StarRating
                            rating={pendingRating}
                            onRate={setPendingRating}
                            interactive={!ratingLoading}
                            size="lg"
                          />
                          <span className="text-lg font-bold text-muted-foreground">
                            {pendingRating > 0 ? pendingRating : '—'}<span className="text-sm font-normal">/5</span>
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            disabled={pendingRating === 0 || ratingLoading}
                            onClick={handleSubmitRating}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold h-11"
                          >
                            {ratingLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Submit Rating
                          </Button>
                          {isEditingRating && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditingRating(false);
                                setPendingRating(ratingData?.userRating ?? 0);
                              }}
                              className="h-11"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Want to rate this post?
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link to="/login">Log in to rate</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-10 pt-6 border-t border-border">
                <h3 className="text-xl font-bold mb-6">
                  Comments {commentsTotal > 0 && `(${commentsTotal})`}
                </h3>

                {/* Comment Form */}
                {isAuthenticated ? (
                  <div className="flex gap-3 mb-8">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-border shrink-0 mt-1"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-1">
                        {user?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={3}
                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          disabled={!newComment.trim() || submittingComment}
                          onClick={handleSubmitComment}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        >
                          {submittingComment ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : null}
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-4 bg-muted/50 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground">
                      <Link to="/login" className="text-green-600 dark:text-green-400 font-semibold hover:underline">
                        Log in
                      </Link>{' '}
                      to join the discussion
                    </p>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-5">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      {comment.userAvatar ? (
                        <img
                          src={comment.userAvatar}
                          alt={comment.userName}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-border shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0 mt-0.5">
                          {comment.userName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{comment.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCommentDate(comment.createdAt)}
                          </span>
                          {isAuthenticated && user?.id === comment.userId && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="ml-auto p-1 text-muted-foreground hover:text-red-500 transition-colors rounded"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Load More */}
                {commentsPage < commentsTotalPages && (
                  <div className="text-center mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMoreComments}
                      disabled={commentsLoading}
                    >
                      {commentsLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : null}
                      Load more comments
                    </Button>
                  </div>
                )}

                {comments.length === 0 && !commentsLoading && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>

            </motion.div>
          </div>
        </section>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="text-center mb-8"
                >
                  <h2 className="text-2xl font-black">Related Articles</h2>
                </motion.div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {related.map((relPost) => (
                    <motion.div
                      key={relPost.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ y: -4 }}
                    >
                      <RelatedCard post={relPost} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <CTASection />
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && post && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowShareModal(false)}
            />
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md bg-card border-2 border-border rounded-2xl shadow-2xl p-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold">Share this article</h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Social Buttons Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(getShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    <span className="text-sm font-medium">Twitter</span>
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    <span className="text-sm font-medium">Facebook</span>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    <span className="text-sm font-medium">LinkedIn</span>
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + getShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#25D366] text-white hover:bg-[#20BD5A] transition-colors"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    <span className="text-sm font-medium">WhatsApp</span>
                  </a>
                </div>

                {/* Copy Link */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-muted rounded-lg text-sm text-muted-foreground truncate">
                    {getShareUrl()}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    className={cn(
                      'shrink-0 gap-1.5 transition-all',
                      copied
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </PublicLayout>
  );
}
