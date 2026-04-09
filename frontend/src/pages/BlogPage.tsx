import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Brain,
  Sparkles,
  Lightbulb,
  Rocket,
  ArrowRight,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { blogService, type BlogPost } from '@/services/blog';

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All Posts', icon: BookOpen, color: 'from-green-500 to-emerald-500' },
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

function BlogCard({ post, index, featured = false }: { post: BlogPost; index: number; featured?: boolean }) {
  const catMeta = CATEGORY_META[post.category] || CATEGORY_META.all;

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link
          to={`/blog/${post.slug}`}
          className="group block bg-card border-2 border-border rounded-2xl overflow-hidden hover:border-green-300 dark:hover:border-green-700 hover:shadow-2xl transition-all"
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Cover image */}
            <div className={cn('relative aspect-video md:aspect-auto md:min-h-[320px] bg-gradient-to-br', catMeta.color)}>
              {post.coverImage ? (
                <img src={post.coverImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <catMeta.icon className="w-24 h-24 text-white/20" />
                  </div>
                </>
              )}
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-900/80 rounded-full text-xs font-bold text-green-700 dark:text-green-400">
                  Featured
                </span>
              </div>
            </div>
            {/* Content */}
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r text-white', catMeta.color)}>
                  <catMeta.icon className="w-3 h-3" />
                  {catMeta.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {post.readTime} min read
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-tight">
                {post.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-5 line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt={post.authorName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                      {post.authorName.charAt(0)}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">{post.authorName}</span>
                    <span className="text-muted-foreground mx-1.5">·</span>
                    <span className="text-muted-foreground">{formatDate(post.publishedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(post.averageRating ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">{post.averageRating?.toFixed(1)}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400 group-hover:gap-2 transition-all">
                    Read More <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -4 }}
    >
      <Link
        to={`/blog/${post.slug}`}
        className="group block h-full bg-card border-2 border-border rounded-2xl overflow-hidden hover:border-green-300 dark:hover:border-green-700 hover:shadow-xl transition-all"
      >
        {/* Cover image */}
        <div className={cn('relative aspect-[16/9] bg-gradient-to-br', catMeta.color)}>
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <catMeta.icon className="w-16 h-16 text-white/20" />
              </div>
            </>
          )}
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
              <Clock className="w-3 h-3" />
              {post.readTime} min
            </span>
          </div>
        </div>
        {/* Body */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r text-white', catMeta.color)}>
              {catMeta.label}
            </span>
          </div>
          <h3 className="font-bold text-lg mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {post.authorAvatar ? (
                <img src={post.authorAvatar} alt={post.authorName} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-[9px]">
                  {post.authorName.charAt(0)}
                </div>
              )}
              <span className="font-medium">{post.authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              {(post.averageRating ?? 0) > 0 && (
                <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground text-[11px]">{post.averageRating?.toFixed(1)}</span>
                </span>
              )}
              <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Read <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const categories = Object.keys(CATEGORY_META);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await blogService.list({
          page,
          limit: 12,
          category: activeCategory !== 'all' ? activeCategory : undefined,
          search: searchQuery || undefined,
        });
        setPosts(res.data);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchPosts, searchQuery ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [page, activeCategory, searchQuery]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const featuredPost = page === 1 && !searchQuery ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-green-50/50 via-emerald-50/30 to-background dark:from-green-950/20 dark:via-emerald-950/10 dark:to-background">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full mb-6 border border-green-200 dark:border-green-800"
              >
                <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Blog
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
                Insights for{' '}
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                  Smarter Studying
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
                Tips, guides, and deep dives on study techniques, AI-powered learning,
                and getting the most out of Studyield.
              </p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-xl mx-auto"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-14 h-14 text-lg rounded-xl border-2 border-border focus:border-green-500"
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {categories.map((catId) => {
                const meta = CATEGORY_META[catId];
                const Icon = meta.icon;
                const isActive = activeCategory === catId;
                return (
                  <button
                    key={catId}
                    onClick={() => handleCategoryChange(catId)}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                        : 'bg-card border-2 border-border hover:border-green-300 dark:hover:border-green-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {meta.label}
                  </button>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Blog Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20">
                  <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No posts found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try a different search term or category
                  </p>
                </div>
              ) : (
                <>
                  {/* Featured Post */}
                  {featuredPost && (
                    <div className="mb-10">
                      <BlogCard post={featuredPost} index={0} featured />
                    </div>
                  )}

                  {/* Posts Grid */}
                  {gridPosts.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gridPosts.map((post, index) => (
                        <BlogCard key={post.id} post={post} index={index} />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-12">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-3">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Post count */}
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Showing {gridPosts.length + (featuredPost ? 1 : 0)} of {total} articles
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Tags Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                    Popular Topics
                  </span>
                </div>
                <h2 className="text-3xl font-black mb-6">Explore by Topic</h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    'Spaced Repetition', 'Flashcards', 'AI Study Tools', 'Exam Prep',
                    'Active Recall', 'Note Taking', 'Study Schedule', 'Productivity',
                    'Live Quiz', 'Deep Research', 'Handwriting OCR', 'Teach Back',
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        setPage(1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <CTASection />
      </div>
    </PublicLayout>
  );
}
