import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Search,
  BookOpen,
  Brain,
  Sparkles,
  GraduationCap,
  Clock,
  Layers,
  FileText,
  Gamepad2,
  MessageSquare,
  Calculator,
  PenTool,
  Microscope,
  Trophy,
  Users,
  Route,
  Presentation,
  BarChart3,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Tutorial {
  title: string;
  description: string;
  duration: string;
  icon: React.ElementType;
  gradient: string;
}

interface TutorialCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  tutorials: Tutorial[];
}

const tutorialCategories: TutorialCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    tutorials: [
      {
        title: 'Creating Your First Study Set',
        description: 'Learn how to create and organize study sets with flashcards, notes, and more.',
        duration: '5:30',
        icon: Layers,
        gradient: 'from-green-500 to-emerald-600',
      },
      {
        title: 'Navigating Studyield',
        description: 'A complete walkthrough of the dashboard, sidebar, and all key sections.',
        duration: '4:15',
        icon: BookOpen,
        gradient: 'from-teal-500 to-cyan-600',
      },
    ],
  },
  {
    id: 'study-tools',
    title: 'Study Tools',
    icon: GraduationCap,
    tutorials: [
      {
        title: 'Mastering Flashcards',
        description: 'Explore standard, cloze deletion, and image occlusion flashcards with spaced repetition.',
        duration: '7:20',
        icon: Layers,
        gradient: 'from-blue-500 to-indigo-600',
      },
      {
        title: 'Taking Smart Notes',
        description: 'Create, generate, and organize notes within your study sets effectively.',
        duration: '6:00',
        icon: FileText,
        gradient: 'from-violet-500 to-purple-600',
      },
      {
        title: 'Quizzes & Live Quiz',
        description: 'Test yourself with auto-generated quizzes or compete in real-time live quiz sessions.',
        duration: '8:10',
        icon: Gamepad2,
        gradient: 'from-pink-500 to-rose-600',
      },
    ],
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    icon: Brain,
    tutorials: [
      {
        title: 'AI Chat Assistant',
        description: 'Ask questions, get explanations, and have intelligent study conversations.',
        duration: '6:45',
        icon: MessageSquare,
        gradient: 'from-amber-500 to-orange-600',
      },
      {
        title: 'Problem Solver',
        description: 'Snap a photo or type a problem and get step-by-step AI solutions.',
        duration: '5:50',
        icon: Calculator,
        gradient: 'from-red-500 to-rose-600',
      },
      {
        title: 'Handwriting OCR',
        description: 'Convert handwritten notes to digital text using AI-powered recognition.',
        duration: '4:30',
        icon: PenTool,
        gradient: 'from-cyan-500 to-blue-600',
      },
      {
        title: 'Deep Research',
        description: 'Generate comprehensive research reports on any topic with AI analysis.',
        duration: '7:00',
        icon: Microscope,
        gradient: 'from-emerald-500 to-green-600',
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    icon: Sparkles,
    tutorials: [
      {
        title: 'Exam Clone',
        description: 'Practice with AI-generated exam simulations tailored to your study material.',
        duration: '8:30',
        icon: Trophy,
        gradient: 'from-yellow-500 to-amber-600',
      },
      {
        title: 'Live Quiz Hosting',
        description: 'Host real-time quiz sessions and compete with friends or classmates.',
        duration: '6:15',
        icon: Users,
        gradient: 'from-indigo-500 to-violet-600',
      },
      {
        title: 'Learning Paths',
        description: 'Follow structured learning paths to master subjects step by step.',
        duration: '5:45',
        icon: Route,
        gradient: 'from-fuchsia-500 to-pink-600',
      },
      {
        title: 'Teach Back Mode',
        description: 'Reinforce your knowledge by teaching concepts back to an AI tutor.',
        duration: '5:00',
        icon: Presentation,
        gradient: 'from-lime-500 to-green-600',
      },
      {
        title: 'Analytics & Progress',
        description: 'Track your study streaks, XP progress, and performance analytics.',
        duration: '4:45',
        icon: BarChart3,
        gradient: 'from-sky-500 to-blue-600',
      },
    ],
  },
];

function TutorialCard({ tutorial, index }: { tutorial: Tutorial; index: number }) {
  const Icon = tutorial.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -4 }}
      className="group bg-card border-2 border-border rounded-2xl overflow-hidden hover:border-green-300 dark:hover:border-green-700 hover:shadow-xl transition-all"
    >
      {/* Video Placeholder */}
      <div className="relative aspect-video overflow-hidden">
        <div className={cn('absolute inset-0 bg-gradient-to-br', tutorial.gradient)} />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Large faded icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-20 h-20 text-white/20" />
        </div>
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 dark:bg-white/80 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-7 h-7 text-green-600 ml-1" />
          </div>
        </div>
        {/* Duration badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
            <Clock className="w-3 h-3" />
            {tutorial.duration}
          </span>
        </div>
        {/* Coming Soon tag */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 bg-white/90 dark:bg-gray-900/80 text-xs font-semibold rounded-lg text-green-700 dark:text-green-400">
            Coming Soon
          </span>
        </div>
      </div>
      {/* Card body */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-1.5 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {tutorial.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tutorial.description}
        </p>
      </div>
    </motion.div>
  );
}

export function TutorialPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // IntersectionObserver for active category tracking
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    tutorialCategories.forEach((category) => {
      const el = sectionRefs.current[category.id];
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveCategory(category.id);
            }
          });
        },
        { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollToCategory = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 100;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Filter tutorials by search query
  const filteredCategories = tutorialCategories
    .map((category) => ({
      ...category,
      tutorials: category.tutorials.filter(
        (t) =>
          !searchQuery ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.tutorials.length > 0);

  const totalTutorials = tutorialCategories.reduce(
    (acc, cat) => acc + cat.tutorials.length,
    0
  );

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
                <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Video Tutorials
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
                Learn How to{' '}
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                  Study Smarter
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
                Watch step-by-step video tutorials to master every feature of Studyield.
                From creating your first study set to advanced AI-powered tools — we've got you covered.
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
                  placeholder={`Search ${totalTutorials} tutorials...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 h-14 text-lg rounded-xl border-2 border-border focus:border-green-500"
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Main Content: Sidebar + Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile: Horizontal scrollable tabs */}
            <div className="lg:hidden mb-8 -mx-4 px-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tutorialCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all shrink-0',
                        isActive
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                          : 'bg-card border-2 border-border hover:border-green-300 dark:hover:border-green-700'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {category.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-10">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-56 shrink-0">
                <div className="sticky top-28">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-4">
                    Categories
                  </h3>
                  <nav className="space-y-1">
                    {tutorialCategories.map((category) => {
                      const Icon = category.icon;
                      const isActive = activeCategory === category.id;
                      return (
                        <button
                          key={category.id}
                          onClick={() => scrollToCategory(category.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                            isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {category.title}
                          <span className="ml-auto text-xs opacity-60">
                            {category.tutorials.length}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </aside>

              {/* Tutorial Grid */}
              <div className="flex-1 min-w-0">
                {filteredCategories.length === 0 && (
                  <div className="text-center py-20">
                    <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-1">No tutorials found</h3>
                    <p className="text-muted-foreground text-sm">
                      Try a different search term
                    </p>
                  </div>
                )}

                {filteredCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div
                      key={category.id}
                      ref={(el) => { sectionRefs.current[category.id] = el; }}
                      className="mb-14 last:mb-0"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black">{category.title}</h2>
                          <p className="text-sm text-muted-foreground">
                            {category.tutorials.length} tutorial{category.tutorials.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {category.tutorials.map((tutorial, index) => (
                          <TutorialCard
                            key={tutorial.title}
                            tutorial={tutorial}
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </div>
    </PublicLayout>
  );
}
