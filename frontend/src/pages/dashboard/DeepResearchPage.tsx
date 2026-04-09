import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import {
  Search,
  Zap,
  Gauge,
  Crown,
  FileText,
  List,
  AlignLeft,
  Globe,
  BookOpen,
  GraduationCap,
  Clock,
  ArrowRight,
  History,
  Trash2,
} from 'lucide-react';
import { researchService } from '@/services/research';
import type { ResearchSession } from '@/services/research';

const DEPTH_OPTIONS = [
  {
    value: 'quick' as const,
    labelKey: 'deepResearch.depthQuick',
    descKey: 'deepResearch.depthQuickDesc',
    icon: Zap,
    color: 'blue',
  },
  {
    value: 'standard' as const,
    labelKey: 'deepResearch.depthStandard',
    descKey: 'deepResearch.depthStandardDesc',
    icon: Gauge,
    color: 'green',
  },
  {
    value: 'comprehensive' as const,
    labelKey: 'deepResearch.depthComprehensive',
    descKey: 'deepResearch.depthComprehensiveDesc',
    icon: Crown,
    color: 'purple',
  },
];

const OUTPUT_FORMATS = [
  { value: 'detailed' as const, labelKey: 'deepResearch.detailedReport', icon: FileText },
  { value: 'summary' as const, labelKey: 'deepResearch.summary', icon: AlignLeft },
  { value: 'bullets' as const, labelKey: 'deepResearch.bulletPoints', icon: List },
];

const EXAMPLE_QUERY_KEYS = [
  'deepResearch.exampleQueries.spacedRepetition',
  'deepResearch.exampleQueries.activeRecall',
  'deepResearch.exampleQueries.testingEffect',
  'deepResearch.exampleQueries.stemStrategies',
];

export function DeepResearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'comprehensive'>('standard');
  const [sourceTypes, setSourceTypes] = useState<string[]>(['web']);
  const [outputFormat, setOutputFormat] = useState<'detailed' | 'summary' | 'bullets'>('detailed');
  const [recentSessions, setRecentSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    researchService.list()
      .then((sessions) => setRecentSessions(sessions.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  const toggleSource = (source: string) => {
    setSourceTypes((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source],
    );
  };

  const handleSubmit = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const session = await researchService.create({
        query: query.trim(),
        depth,
        sourceTypes,
        outputFormat,
      });
      navigate(`/dashboard/research/progress/${session.id}`);
    } catch {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await researchService.delete(id);
      setRecentSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // Silently ignore delete errors
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    planning: 'bg-blue-500/10 text-blue-500',
    researching: 'bg-blue-500/10 text-blue-500',
    synthesizing: 'bg-purple-500/10 text-purple-500',
    completed: 'bg-green-500/10 text-green-500',
    failed: 'bg-red-500/10 text-red-500',
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{t('deepResearch.title')}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/research/history')}
            >
              <History className="w-4 h-4 mr-2" />
              {t('deepResearch.history')}
            </Button>
          </div>
          <p className="text-muted-foreground">
            {t('deepResearch.subtitle')}
          </p>
        </motion.div>

        {/* Query Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-2">{t('deepResearch.researchQuestion')}</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('deepResearch.placeholder')}
            className="w-full h-28 px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">{t('deepResearch.try')}</span>
            {EXAMPLE_QUERY_KEYS.map((key) => {
              const eq = t(key);
              return (
                <button
                  key={key}
                  onClick={() => setQuery(eq)}
                  className="text-xs px-2.5 py-1 bg-muted/50 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  {eq.length > 50 ? eq.slice(0, 50) + '...' : eq}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Source Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-3">{t('deepResearch.sources')}</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'documents', label: t('deepResearch.userDocuments'), icon: BookOpen },
              { key: 'web', label: t('deepResearch.webSearch'), icon: Globe },
              { key: 'academic', label: t('deepResearch.academicPapers'), icon: GraduationCap },
            ].map((src) => {
              const active = sourceTypes.includes(src.key);
              return (
                <button
                  key={src.key}
                  onClick={() => toggleSource(src.key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    active
                      ? 'border-green-500/50 bg-green-500/5 text-green-600'
                      : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  <src.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{src.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Depth Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-3">{t('deepResearch.researchDepth')}</label>
          <div className="grid grid-cols-3 gap-3">
            {DEPTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDepth(opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  depth === opt.value
                    ? `border-${opt.color}-500/50 bg-${opt.color}-500/5`
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <opt.icon className={`w-5 h-5 ${depth === opt.value ? `text-${opt.color}-500` : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${depth === opt.value ? '' : 'text-muted-foreground'}`}>{t(opt.labelKey)}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t(opt.descKey)}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Output Format */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-3">{t('deepResearch.outputFormat')}</label>
          <div className="flex gap-3">
            {OUTPUT_FORMATS.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setOutputFormat(fmt.value)}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  outputFormat === fmt.value
                    ? 'border-green-500/50 bg-green-500/5 text-green-600'
                    : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                <fmt.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{t(fmt.labelKey)}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || loading}
            className="w-full bg-green-500 hover:bg-green-600 h-12 text-base"
          >
            {loading ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Search className="w-5 h-5 mr-2" />
            )}
            {loading ? t('deepResearch.creatingSession') : t('deepResearch.startResearch')}
          </Button>
        </motion.div>

        {/* Recent Sessions */}
        {!loadingSessions && recentSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('deepResearch.recentResearch')}</h2>
              <button
                onClick={() => navigate('/dashboard/research/history')}
                className="text-sm text-green-500 font-medium hover:underline flex items-center gap-1"
              >
                {t('deepResearch.viewAll')} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() =>
                    session.status === 'completed'
                      ? navigate(`/dashboard/research/report/${session.id}`)
                      : session.status === 'failed' || session.status === 'pending'
                        ? navigate(`/dashboard/research/progress/${session.id}`)
                        : navigate(`/dashboard/research/progress/${session.id}`)
                  }
                  className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-muted-foreground/30 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.query}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status] || ''}`}>
                        {session.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      {session.sources.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {t('deepResearch.sourcesCount', { count: session.sources.length })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DeepResearchPage;
