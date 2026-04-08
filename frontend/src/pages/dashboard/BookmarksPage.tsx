import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Bookmark,
  BookmarkX,
  Loader2,
  FileText,
  ChevronRight,
  Trash2,
  StickyNote,
  Clock,
} from 'lucide-react';

interface BookmarkedQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[] | null;
  difficulty: string;
  topic: string | null;
  examCloneId: string;
  examTitle: string;
  bookmarkNote: string | null;
  bookmarkedAt: string;
}

export default function BookmarksPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<BookmarkedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(ENDPOINTS.examClone.bookmarks);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRemoveBookmark = async (questionId: string) => {
    setRemovingId(questionId);
    try {
      await api.delete(ENDPOINTS.examClone.bookmark(questionId));
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/10 text-green-600';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600';
      case 'hard':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Group by exam
  const groupedByExam = questions.reduce((acc, q) => {
    if (!acc[q.examCloneId]) {
      acc[q.examCloneId] = { title: q.examTitle, questions: [] };
    }
    acc[q.examCloneId].questions.push(q);
    return acc;
  }, {} as Record<string, { title: string; questions: BookmarkedQuestion[] }>);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard/exam-clone')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-white" />
              </div>
              {t('bookmarksPage.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('bookmarksPage.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{questions.length}</p>
              <p className="text-sm text-muted-foreground">{t('bookmarksPage.bookmarkedQuestions')}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold">{Object.keys(groupedByExam).length}</p>
              <p className="text-sm text-muted-foreground">{t('bookmarksPage.fromDifferentExams')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : questions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-card border border-border rounded-xl"
          >
            <BookmarkX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('bookmarksPage.noBookmarksYet')}</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {t('bookmarksPage.noBookmarksDescription')}
            </p>
            <Button onClick={() => navigate('/dashboard/exam-clone')}>
              {t('bookmarksPage.startPracticing')}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByExam).map(([examId, { title, questions: examQuestions }]) => (
              <div key={examId}>
                {/* Exam Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-500" />
                    <h2 className="font-semibold">{title}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({examQuestions.length} {t('bookmarksPage.questions')})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/dashboard/exam-clone/${examId}`)}
                  >
                    {t('bookmarksPage.viewExam')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Questions */}
                <div className="space-y-3">
                  <AnimatePresence>
                    {examQuestions.map((q, index) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card border border-border rounded-xl overflow-hidden"
                      >
                        {/* Question Header */}
                        <div
                          onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <Bookmark className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium line-clamp-2">{q.question}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded text-xs font-medium',
                                    getDifficultyColor(q.difficulty)
                                  )}
                                >
                                  {q.difficulty}
                                </span>
                                {q.topic && (
                                  <span className="px-2 py-0.5 bg-muted rounded text-xs">
                                    {q.topic}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                  <Clock className="w-3 h-3" />
                                  {new Date(q.bookmarkedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveBookmark(q.id);
                              }}
                              disabled={removingId === q.id}
                              className="shrink-0 text-destructive hover:text-destructive"
                            >
                              {removingId === q.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {expandedId === q.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-border"
                            >
                              <div className="p-4 space-y-4">
                                {/* Options */}
                                {q.options && q.options.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">{t('bookmarksPage.options')}</p>
                                    <div className="grid gap-2">
                                      {q.options.map((opt, i) => (
                                        <div
                                          key={i}
                                          className={cn(
                                            'px-3 py-2 rounded-lg text-sm',
                                            opt === q.correctAnswer
                                              ? 'bg-green-500/10 border border-green-500/30 text-green-600'
                                              : 'bg-muted'
                                          )}
                                        >
                                          {String.fromCharCode(65 + i)}. {opt}
                                          {opt === q.correctAnswer && (
                                            <span className="ml-2 text-xs">{t('bookmarksPage.correct')}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Correct Answer */}
                                {!q.options && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                      {t('bookmarksPage.correctAnswer')}
                                    </p>
                                    <p className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600">
                                      {q.correctAnswer}
                                    </p>
                                  </div>
                                )}

                                {/* Note */}
                                {q.bookmarkNote && (
                                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg">
                                    <StickyNote className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-sm">{q.bookmarkNote}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
