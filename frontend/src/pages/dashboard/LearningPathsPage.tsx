import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import type { LearningPath } from '@/services/learningPaths';
import { learningPathsService } from '@/services/learningPaths';
import {
  Route,
  Sparkles,
  ChevronRight,
  Trash2,
  Clock,
  Target,
  BarChart3,
  X,
  GraduationCap,
  Zap,
  CheckCircle,
} from 'lucide-react';

export function LearningPathsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Generate form
  const [topic, setTopic] = useState('');
  const [currentLevel, setCurrentLevel] = useState<string>('beginner');
  const [targetLevel, setTargetLevel] = useState<string>('intermediate');
  const [hoursPerWeek, setHoursPerWeek] = useState(5);

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    try {
      setPaths(await learningPathsService.list());
    } catch {}
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const path = await learningPathsService.generate({
        topic: topic.trim(),
        currentLevel,
        targetLevel,
        availableHoursPerWeek: hoursPerWeek,
      });
      navigate(`/dashboard/learning-paths/${path.id}`);
    } catch {}
    setGenerating(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await learningPathsService.delete(id);
      setPaths((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  const getDifficultyBadge = (d: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500/10 text-green-500',
      intermediate: 'bg-amber-500/10 text-amber-500',
      advanced: 'bg-red-500/10 text-red-500',
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${colors[d] || 'bg-muted text-muted-foreground'}`}>
        {t(`learningPaths.levels.${d}`)}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Route className="w-5 h-5 text-white" />
              </div>
              {t('learningPaths.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('learningPaths.description')}</p>
          </div>
          <Button onClick={() => setShowGenerate(!showGenerate)}>
            <Sparkles className="w-4 h-4 mr-2" /> {t('learningPaths.generate')}
          </Button>
        </div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold">{t('learningPaths.howItWorks')}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: '1', titleKey: 'learningPaths.step1Title', descKey: 'learningPaths.step1Desc', icon: Target },
              { step: '2', titleKey: 'learningPaths.step2Title', descKey: 'learningPaths.step2Desc', icon: Route },
              { step: '3', titleKey: 'learningPaths.step3Title', descKey: 'learningPaths.step3Desc', icon: BarChart3 },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-1.5 text-sm font-bold">
                  {item.step}
                </div>
                <p className="text-xs font-medium">{t(item.titleKey)}</p>
                <p className="text-[10px] text-muted-foreground">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Generate Panel */}
        <AnimatePresence>
          {showGenerate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div className="bg-card border-2 border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> {t('learningPaths.generate')}
                  </p>
                  <button onClick={() => setShowGenerate(false)}><X className="w-4 h-4" /></button>
                </div>

                <div className="space-y-4">
                  {/* Topic */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('learningPaths.topicLabel')}</label>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder={t('learningPaths.topicPlaceholder')}
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Levels */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('learningPaths.currentLevel')}</label>
                      <select value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)} className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm">
                        <option value="beginner">{t('learningPaths.levels.beginner')}</option>
                        <option value="intermediate">{t('learningPaths.levels.intermediate')}</option>
                        <option value="advanced">{t('learningPaths.levels.advanced')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('learningPaths.targetLevel')}</label>
                      <select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm">
                        <option value="intermediate">{t('learningPaths.levels.intermediate')}</option>
                        <option value="advanced">{t('learningPaths.levels.advanced')}</option>
                        <option value="expert">{t('learningPaths.levels.expert')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Hours */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      {t('learningPaths.hoursPerWeek')} <span className="text-amber-500 font-bold">{hoursPerWeek}h</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>1h</span><span>10h</span><span>20h</span><span>40h</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleGenerate} disabled={!topic.trim() || generating}>
                      {generating ? <><Spinner size="sm" className="mr-2" /> {t('common.processing')}</> : <><Sparkles className="w-4 h-4 mr-2" /> {t('learningPaths.generate')}</>}
                    </Button>
                    <Button variant="outline" onClick={() => setShowGenerate(false)}>{t('common.cancel')}</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paths List */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : paths.length === 0 && !showGenerate ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Route className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('common.noResults')}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              {t('learningPaths.emptyDesc')}
            </p>
            <Button onClick={() => setShowGenerate(true)}>
              <Sparkles className="w-4 h-4 mr-2" /> {t('learningPaths.generate')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paths.map((path, i) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/dashboard/learning-paths/${path.id}`)}
                className="bg-card border border-border rounded-xl p-4 hover:border-amber-500/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {/* Progress Ring */}
                  <div className="relative shrink-0">
                    <svg viewBox="0 0 44 44" className="w-12 h-12">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={3} />
                      <circle
                        cx="22" cy="22" r="18" fill="none"
                        stroke={path.progress >= 100 ? '#22c55e' : '#f59e0b'}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 18}`}
                        strokeDashoffset={`${2 * Math.PI * 18 * (1 - path.progress / 100)}`}
                        transform="rotate(-90 22 22)"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                      {path.progress}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{path.title}</p>
                      {getDifficultyBadge(path.difficulty)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {path.subject}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{path.estimatedHours}h</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {t('learningPaths.stepsCount', { completed: path.steps.filter((s) => s.isCompleted).length, total: path.steps.length })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(path.id, e)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default LearningPathsPage;
