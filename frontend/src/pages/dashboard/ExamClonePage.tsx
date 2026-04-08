import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  Plus,
  FileText,
  Loader2,
  Trash2,
  Play,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Upload,
  Brain,
  BarChart3,
  Target,
  BookOpen,
  X,
  Bell,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamStyle {
  questionTypes: string[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
  averageQuestionLength: number;
  topicsCovered: string[];
  formatPatterns: string[];
  languageStyle: string;
}

interface ExamClone {
  id: string;
  userId: string;
  title: string;
  subject: string | null;
  originalFileUrl: string | null;
  extractedStyle: ExamStyle | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalQuestionCount: number;
  generatedQuestionCount: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  pending: { labelKey: 'examClone.status.pending', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
  processing: { labelKey: 'examClone.status.processing', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Loader2 },
  completed: { labelKey: 'examClone.status.completed', color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle },
  failed: { labelKey: 'examClone.status.failed', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
};

export default function ExamClonePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamClone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reviewQueueCount, setReviewQueueCount] = useState(0);
  const [showReviewNotification, setShowReviewNotification] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReviewQueueCount = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS.examClone.reviewQueue);
      const count = response.data.length;
      if (count > 0 && reviewQueueCount === 0) {
        // New items due - show notification
        setShowReviewNotification(true);
      }
      setReviewQueueCount(count);
    } catch (err) {
      console.error('Failed to fetch review queue:', err);
    }
  }, [reviewQueueCount]);

  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<ExamClone[]>(ENDPOINTS.examClone.list);
      setExams(response.data);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
    fetchReviewQueueCount();

    // Poll every 30 seconds for new review items
    pollIntervalRef.current = setInterval(fetchReviewQueueCount, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchExams, fetchReviewQueueCount]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(ENDPOINTS.examClone.get(id));
      setExams((prev) => prev.filter((e) => e.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete exam:', err);
    }
  };

  const handleUploadSuccess = (newExam: ExamClone) => {
    setExams((prev) => [newExam, ...prev]);
    setShowUploadModal(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              {t('examClone.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('examClone.description')}
            </p>
          </div>
          <Button onClick={() => setShowUploadModal(true)} className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            {t('examClone.generate')}
          </Button>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => navigate('/dashboard/exam-clone/review-queue')}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-amber-500/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <Brain className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{t('studySets.reviewQueue')}</p>
              <p className="text-xs text-muted-foreground">
                {reviewQueueCount > 0 ? `${reviewQueueCount} due` : t('flashcards.allCaughtUp')}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/dashboard/exam-clone/bookmarks')}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-blue-500/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{t('problemSolver.bookmarks')}</p>
              <p className="text-xs text-muted-foreground">{t('examClone.savedQuestions')}</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/dashboard/exam-clone/badges')}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-yellow-500/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
              <Target className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{t('badges.title')}</p>
              <p className="text-xs text-muted-foreground">{t('examClone.achievements')}</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/dashboard/exam-clone/leaderboard')}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-purple-500/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{t('leaderboard.title')}</p>
              <p className="text-xs text-muted-foreground">{t('examClone.rankings')}</p>
            </div>
          </button>
        </div>

        {/* Review Queue Notification */}
        <AnimatePresence>
          {reviewQueueCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "mb-6 p-4 rounded-xl border-2 cursor-pointer transition-all",
                showReviewNotification
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500 animate-pulse"
                  : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/60"
              )}
              onClick={() => {
                setShowReviewNotification(false);
                navigate('/dashboard/exam-clone/review-queue');
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Bell className="w-6 h-6 text-amber-500" />
                    </div>
                    {showReviewNotification && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                    )}
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      {reviewQueueCount > 9 ? '9+' : reviewQueueCount}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {t('examClone.reviewTime')}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({t('examClone.questionsDue', { count: reviewQueueCount })})
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('examClone.reinforceLearning')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchReviewQueueCount();
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReviewNotification(false);
                      navigate('/dashboard/exam-clone/review-queue');
                    }}
                  >
                    {t('dashboard.studyNow')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Overview */}
        {exams.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{exams.length}</p>
                  <p className="text-xs text-muted-foreground">{t('examClone.examsUploaded')}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {exams.reduce((acc, e) => acc + e.originalQuestionCount, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('examClone.originalQuestions')}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {exams.reduce((acc, e) => acc + e.generatedQuestionCount, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('examClone.generatedQuestions')}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {exams.filter((e) => e.status === 'completed').length}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('examClone.readyToPractice')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exams List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : exams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-card border border-border rounded-2xl"
          >
            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('common.noResults')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('examClone.emptyDesc')}
            </p>
            <Button onClick={() => setShowUploadModal(true)} className="bg-purple-500 hover:bg-purple-600">
              <Upload className="w-4 h-4 mr-2" />
              {t('examClone.uploadFirst')}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {exams.map((exam, index) => {
                const statusConfig = STATUS_CONFIG[exam.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-purple-500/30 transition-colors"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-purple-500" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">{exam.title}</h3>
                              {exam.subject && (
                                <p className="text-sm text-muted-foreground">{exam.subject}</p>
                              )}
                            </div>
                            <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.bg, statusConfig.color)}>
                              <StatusIcon className={cn('w-3.5 h-3.5', exam.status === 'processing' && 'animate-spin')} />
                              {t(statusConfig.labelKey)}
                            </div>
                          </div>

                          {/* Stats */}
                          {exam.status === 'completed' && exam.extractedStyle && (
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <BookOpen className="w-4 h-4" />
                                <span>{t('examClone.nOriginal', { count: exam.originalQuestionCount })}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Sparkles className="w-4 h-4" />
                                <span>{t('examClone.nGenerated', { count: exam.generatedQuestionCount })}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <BarChart3 className="w-4 h-4" />
                                <span>{t('examClone.nTypes', { count: exam.extractedStyle.questionTypes.length })}</span>
                              </div>
                            </div>
                          )}

                          {/* Topics */}
                          {exam.extractedStyle?.topicsCovered && exam.extractedStyle.topicsCovered.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {exam.extractedStyle.topicsCovered.slice(0, 5).map((topic, i) => (
                                <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">
                                  {topic}
                                </span>
                              ))}
                              {exam.extractedStyle.topicsCovered.length > 5 && (
                                <span className="px-2 py-0.5 text-muted-foreground text-xs">
                                  {t('examClone.moreTopics', { count: exam.extractedStyle.topicsCovered.length - 5 })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {t('examClone.uploadedOn', { date: new Date(exam.createdAt).toLocaleDateString() })}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(exam.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {exam.status === 'completed' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/dashboard/exam-clone/${exam.id}`)}
                              >
                                {t('examClone.viewAnalysis')}
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => navigate(`/dashboard/exam-clone/${exam.id}/practice`)}
                                className="bg-purple-500 hover:bg-purple-600"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                {t('examClone.practiceExam')}
                              </Button>
                            </>
                          )}
                          {exam.status === 'failed' && (
                            <Button variant="outline" size="sm" disabled>
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {t('examClone.analysisFailed')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <UploadExamModal
              onClose={() => setShowUploadModal(false)}
              onSuccess={handleUploadSuccess}
            />
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {deleteId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setDeleteId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
              >
                <h3 className="text-lg font-semibold mb-2">{t('deleteConfirm.title')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('examClone.deleteWarning')}
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeleteId(null)}>
                    {t('common.cancel')}
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(deleteId)}>
                    {t('common.delete')}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

// Upload Exam Modal Component
function UploadExamModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (exam: ExamClone) => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [examText, setExamText] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(t('examClone.upload.errorTitle'));
      return;
    }

    if (uploadMode === 'file' && !file) {
      setError(t('examClone.upload.errorFile'));
      return;
    }

    if (uploadMode === 'text' && !examText.trim()) {
      setError(t('examClone.upload.errorText'));
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // First create the exam clone
      const createResponse = await api.post<ExamClone>(ENDPOINTS.examClone.list, {
        title,
        subject: subject || undefined,
        examText: uploadMode === 'text' ? examText : undefined,
      });

      const examClone = createResponse.data;

      // If file mode, upload the file
      if (uploadMode === 'file' && file) {
        const formData = new FormData();
        formData.append('file', file);

        await api.post(ENDPOINTS.examClone.upload(examClone.id), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // Fetch updated exam data (status may have changed to 'completed')
        const updatedResponse = await api.get<ExamClone>(ENDPOINTS.examClone.get(examClone.id));
        onSuccess(updatedResponse.data);
      } else {
        onSuccess(examClone);
      }
    } catch (err) {
      console.error('Failed to upload exam:', err);
      setError(t('examClone.upload.errorUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold">{t('examClone.upload.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('examClone.upload.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('examClone.upload.examTitle')} *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('examClone.upload.examTitlePlaceholder')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('examClone.upload.subject')}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('examClone.upload.subjectPlaceholder')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Upload Mode Toggle */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('examClone.upload.method')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                  uploadMode === 'file'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                    : 'border-border hover:border-purple-500/50'
                )}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                {t('examClone.upload.uploadPdf')}
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                  uploadMode === 'text'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                    : 'border-border hover:border-purple-500/50'
                )}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                {t('examClone.upload.pasteText')}
              </button>
            </div>
          </div>

          {/* File Upload */}
          {uploadMode === 'file' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('examClone.upload.examFile')}</label>
              <div
                onClick={() => document.getElementById('exam-file-input')?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                  file ? 'border-purple-500 bg-purple-500/5' : 'border-border hover:border-purple-500/50'
                )}
              >
                <input
                  id="exam-file-input"
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-purple-500" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">{t('examClone.upload.dragDrop')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('notes.pdfFormats')}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Text Input */}
          {uploadMode === 'text' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('examClone.upload.examContent')}</label>
              <textarea
                value={examText}
                onChange={(e) => setExamText(e.target.value)}
                placeholder="Paste the exam questions here...&#10;&#10;1. What is photosynthesis?&#10;A) Process of making food&#10;B) Process of breathing&#10;..."
                rows={10}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {examText.length} characters
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('examClone.upload.uploading')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t('examClone.upload.uploadAnalyze')}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
