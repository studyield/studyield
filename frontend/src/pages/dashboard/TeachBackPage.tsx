import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import type { TeachBackSession } from '@/services/teachBack';
import { teachBackService } from '@/services/teachBack';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  GraduationCap,
  Plus,
  Trash2,
  ChevronRight,
  CheckCircle,
  Clock,
  FileText,
  Sparkles,
  Target,
  Library,
  Zap,
} from 'lucide-react';

const SUGGESTED_TOPICS = [
  'Pythagorean Theorem',
  'Photosynthesis',
  'Newton\'s Laws of Motion',
  'Supply and Demand',
  'DNA Replication',
  'Quadratic Formula',
  'Ohm\'s Law',
  'Cell Division (Mitosis)',
];

interface StudySetOption {
  id: string;
  title: string;
  flashcardsCount: number;
}

export function TeachBackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TeachBackSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState('');
  const [reference, setReference] = useState('');
  const [createMode, setCreateMode] = useState<'manual' | 'study-set'>('manual');
  const [studySets, setStudySets] = useState<StudySetOption[]>([]);
  const [studySetsLoading, setStudySetsLoading] = useState(false);
  const [selectedStudySetId, setSelectedStudySetId] = useState('');

  const loadSessions = async () => {
    try {
      setSessions(await teachBackService.list());
    } catch {
      // Silently ignore fetch errors
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStudySets = async () => {
    if (studySets.length > 0) return;
    setStudySetsLoading(true);
    try {
      const res = await api.get(ENDPOINTS.studySets.list, { params: { limit: 100 } });
      const items = res.data?.data || res.data || [];
      setStudySets(
        (Array.isArray(items) ? items : []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          title: (s.title || s.name || 'Untitled') as string,
          flashcardsCount: (s.flashcardsCount || s.flashcards_count || 0) as number,
        })),
      );
    } catch {
      // Silently ignore fetch errors
    }
    setStudySetsLoading(false);
  };

  const handleCreate = async () => {
    if (!topic.trim()) return;
    setCreating(true);
    try {
      const session = await teachBackService.create(topic.trim(), reference.trim() || undefined);
      navigate(`/dashboard/teach-back/${session.id}`);
    } catch {
      // Silently ignore creation errors
    }
    setCreating(false);
  };

  const handleCreateFromStudySet = async () => {
    if (!selectedStudySetId) return;
    setCreating(true);
    try {
      const session = await teachBackService.createFromStudySet(selectedStudySetId);
      navigate(`/dashboard/teach-back/${session.id}`);
    } catch {
      // Silently ignore creation errors
    }
    setCreating(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await teachBackService.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // Silently ignore delete errors
    }
  };

  const getStatusBadge = (status: TeachBackSession['status'], score?: number) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
            <Clock className="w-3 h-3" /> Awaiting Explanation
          </span>
        );
      case 'submitted':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
            <FileText className="w-3 h-3" /> Ready to Evaluate
          </span>
        );
      case 'evaluated':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
            <CheckCircle className="w-3 h-3" /> Score: {score ?? 0}/100
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              {t('teachBack.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('teachBack.description')}
            </p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('teachBack.startSession')}
          </Button>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/20 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-semibold">The Feynman Technique</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { step: '1', title: 'Pick Topic', desc: 'Choose what to master', color: 'violet' },
              { step: '2', title: 'Explain It', desc: 'Teach it in your words', color: 'purple' },
              { step: '3', title: 'Get Scored', desc: 'AI evaluates depth', color: 'blue' },
              { step: '4', title: 'Refine', desc: 'Fill knowledge gaps', color: 'green' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`w-8 h-8 rounded-full bg-${item.color}-500/10 text-${item.color}-500 flex items-center justify-center mx-auto mb-1.5 text-sm font-bold`}>
                  {item.step}
                </div>
                <p className="text-xs font-medium">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Create Panel */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-500" />
                  {t('teachBack.session')}
                </h3>

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setCreateMode('manual')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      createMode === 'manual'
                        ? 'bg-violet-500/10 text-violet-500 border-2 border-violet-500'
                        : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" /> Enter Topic
                  </button>
                  <button
                    onClick={() => { setCreateMode('study-set'); loadStudySets(); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      createMode === 'study-set'
                        ? 'bg-violet-500/10 text-violet-500 border-2 border-violet-500'
                        : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <Library className="w-3.5 h-3.5" /> From Study Set
                  </button>
                </div>

                {createMode === 'manual' ? (
                  <>
                    {/* Topic Input */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        What topic do you want to master?
                      </label>
                      <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Pythagorean Theorem, Photosynthesis, Supply & Demand..."
                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>

                    {/* Quick Suggestions */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Quick picks:</p>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_TOPICS.map((t) => (
                          <button
                            key={t}
                            onClick={() => setTopic(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              topic === t
                                ? 'bg-violet-500 text-white'
                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reference Content (Optional) */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Reference material (optional — helps AI evaluate better)
                      </label>
                      <textarea
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Paste textbook notes, lecture content, or key points here..."
                        className="w-full h-24 px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleCreate} disabled={!topic.trim() || creating}>
                        {creating ? (
                          <>
                            <Spinner size="sm" className="mr-2" /> Creating...
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-4 h-4 mr-2" /> Start Teaching
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreate(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Study Set Picker */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Pick a study set — we'll auto-generate the topic from your flashcards
                      </label>
                      {studySetsLoading ? (
                        <div className="flex justify-center py-6">
                          <Spinner size="sm" />
                        </div>
                      ) : studySets.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No study sets found. Create one first!
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {studySets.map((ss) => (
                            <button
                              key={ss.id}
                              onClick={() => setSelectedStudySetId(ss.id)}
                              className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                                selectedStudySetId === ss.id
                                  ? 'bg-violet-500/10 border-2 border-violet-500'
                                  : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                              }`}
                            >
                              <Library className="w-4 h-4 text-violet-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{ss.title}</p>
                                <p className="text-xs text-muted-foreground">{ss.flashcardsCount} cards</p>
                              </div>
                              {selectedStudySetId === ss.id && (
                                <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleCreateFromStudySet} disabled={!selectedStudySetId || creating}>
                        {creating ? (
                          <>
                            <Spinner size="sm" className="mr-2" /> Generating...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" /> Generate & Start
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreate(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sessions List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : sessions.length === 0 && !showCreate ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-card border border-border rounded-2xl"
          >
            <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              The best way to learn is to teach. Pick a topic and explain it as if
              you&apos;re teaching a friend — AI will evaluate your understanding.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create First Session
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/dashboard/teach-back/${session.id}`)}
                className="bg-card border border-border rounded-xl p-4 hover:border-violet-500/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium truncate">{session.topic}</p>
                      {getStatusBadge(session.status, session.evaluation?.overallScore)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString()}
                      {session.evaluation && (
                        <> — Accuracy: {session.evaluation.accuracy.score}% | Clarity: {session.evaluation.clarity.score}%</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
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

export default TeachBackPage;
