import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import type { LearningPath } from '@/services/learningPaths';
import { learningPathsService } from '@/services/learningPaths';
import {
  ArrowLeft,
  Route,
  Clock,
  CheckCircle,
  BookOpen,
  HelpCircle,
  Dumbbell,
  RotateCcw,
  Play,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

const STEP_ICONS: Record<string, typeof BookOpen> = {
  study: BookOpen,
  quiz: HelpCircle,
  practice: Dumbbell,
  review: RotateCcw,
};

const STEP_COLORS: Record<string, string> = {
  study: 'blue',
  quiz: 'violet',
  practice: 'amber',
  review: 'green',
};

export function LearningPathDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setPath(await learningPathsService.get(id));
      } catch {
        // Silently ignore fetch errors
      }
      setLoading(false);
    })();
  }, [id]);

  const handleCompleteStep = async (stepId: string) => {
    if (!id) return;
    setCompleting(stepId);
    try {
      const updated = await learningPathsService.completeStep(id, stepId);
      setPath(updated);
    } catch {
      // Silently ignore completion errors
    }
    setCompleting(null);
  };

  if (loading) {
    return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>;
  }

  if (!path) {
    return <DashboardLayout><div className="max-w-3xl mx-auto text-center py-20"><p className="text-muted-foreground">{t('learningPathDetail.pathNotFound')}</p></div></DashboardLayout>;
  }

  const completedSteps = path.steps.filter((s) => s.isCompleted).length;
  const totalMinutes = path.steps.reduce((acc, s) => acc + s.estimatedMinutes, 0);
  const remainingMinutes = path.steps.filter((s) => !s.isCompleted).reduce((acc, s) => acc + s.estimatedMinutes, 0);
  const nextStep = path.steps.find((s) => !s.isCompleted);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard/learning-paths')} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Route className="w-5 h-5 text-amber-500" />
              {path.title}
            </h1>
            {path.description && <p className="text-sm text-muted-foreground mt-0.5">{path.description}</p>}
          </div>
        </div>

        {/* Progress Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-6">
            {/* Progress Circle */}
            <div className="relative shrink-0">
              <svg viewBox="0 0 80 80" className="w-20 h-20">
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={5} />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={path.progress >= 100 ? '#22c55e' : '#f59e0b'}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - path.progress / 100)}`}
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{path.progress}%</span>
                <span className="text-[9px] text-muted-foreground">{t('learningPathDetail.complete')}</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                  <Target className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold">{completedSteps}/{path.steps.length}</p>
                <p className="text-[10px] text-muted-foreground">{t('learningPathDetail.stepsDone')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold">{Math.round(remainingMinutes / 60)}h</p>
                <p className="text-[10px] text-muted-foreground">{t('learningPathDetail.remaining')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold">{Math.round(totalMinutes / 60)}h</p>
                <p className="text-[10px] text-muted-foreground">{t('learningPathDetail.totalTime')}</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${path.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${path.progress >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
            />
          </div>

          {path.progress >= 100 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-center justify-center gap-2 text-green-500">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-semibold">{t('learningPathDetail.pathCompleted')}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Next recommended step */}
        {nextStep && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6">
            <p className="text-xs font-medium text-amber-500 mb-2 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> {t('learningPathDetail.nextRecommendedStep')}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{nextStep.title}</p>
                <p className="text-xs text-muted-foreground">{nextStep.estimatedMinutes} min · {nextStep.type}</p>
              </div>
              <Button size="sm" onClick={() => handleCompleteStep(nextStep.id)} disabled={completing === nextStep.id}>
                {completing === nextStep.id ? <Spinner size="sm" /> : <><CheckCircle className="w-3.5 h-3.5 mr-1" /> {t('learningPathDetail.markDone')}</>}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Steps Timeline */}
        <div className="space-y-0">
          {path.steps
            .sort((a, b) => a.order - b.order)
            .map((step, i) => {
              const StepIcon = STEP_ICONS[step.type] || BookOpen;
              const color = STEP_COLORS[step.type] || 'blue';
              const isExpanded = expandedStep === step.id;
              const isNext = nextStep?.id === step.id;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {i < path.steps.length - 1 && (
                    <div className={`absolute left-[23px] top-12 w-0.5 h-[calc(100%-12px)] ${step.isCompleted ? 'bg-green-500' : 'bg-border'}`} />
                  )}

                  <div
                    className={`flex gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                      isNext ? 'bg-amber-500/5 border border-amber-500/20' : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  >
                    {/* Step indicator */}
                    <div className={`w-[46px] h-[46px] rounded-xl flex items-center justify-center shrink-0 ${
                      step.isCompleted
                        ? 'bg-green-500/10 text-green-500'
                        : isNext
                          ? `bg-${color}-500/10 text-${color}-500 ring-2 ring-${color}-500/30`
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${step.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {step.order}. {step.title}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize bg-${color}-500/10 text-${color}-500`}>
                          {step.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {step.estimatedMinutes} min
                        </span>
                        {step.isCompleted && step.completedAt && (
                          <span className="text-xs text-green-500">
                            {t('learningPathDetail.completed', { date: new Date(step.completedAt).toLocaleDateString() })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!step.isCompleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); handleCompleteStep(step.id); }}
                          disabled={completing === step.id}
                          className="text-xs"
                        >
                          {completing === step.id ? <Spinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-[58px] pb-3"
                    >
                      <div className="bg-muted/20 rounded-lg p-3 mt-1">
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.resourceId && step.resourceType && (
                          <Button size="sm" variant="outline" className="mt-2" asChild>
                            <a href={
                              step.resourceType === 'study_set' ? `/dashboard/study-sets/${step.resourceId}`
                                : step.resourceType === 'quiz' ? `/dashboard/quiz/${step.resourceId}`
                                : '#'
                            }>
                              <BookOpen className="w-3.5 h-3.5 mr-1" /> {t('learningPathDetail.open', { type: step.resourceType.replace('_', ' ') })}
                            </a>
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default LearningPathDetailPage;
