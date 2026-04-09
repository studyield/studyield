import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import type { TeachBackSession, TopicEssentials, ChallengeMessage } from '@/services/teachBack';
import { teachBackService } from '@/services/teachBack';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  ArrowLeft,
  GraduationCap,
  Mic,
  MicOff,
  Send,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  Star,
  Target,
  TrendingUp,
  Swords,
  MessageCircle,
  Zap,
  PartyPopper,
} from 'lucide-react';

// Radar chart drawn with SVG
function ScoreRadar({ scores }: { scores: { label: string; value: number; color: string }[] }) {
  const cx = 120, cy = 120, r = 90;
  const n = scores.length;

  const getPoint = (i: number, val: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (val / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const polygonPoints = scores.map((s, i) => {
    const p = getPoint(i, s.value);
    return `${p.x},${p.y}`;
  }).join(' ');

  const gridLevels = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[280px] mx-auto">
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={scores.map((_, i) => {
            const p = getPoint(i, level);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={1}
        />
      ))}
      {scores.map((_, i) => {
        const p = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />;
      })}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
        points={polygonPoints}
        fill="rgba(139,92,246,0.15)"
        stroke="rgb(139,92,246)"
        strokeWidth={2}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {scores.map((s, i) => {
        const p = getPoint(i, s.value);
        const lp = getPoint(i, 115);
        return (
          <g key={i}>
            <motion.circle
              initial={{ r: 0 }}
              animate={{ r: 4 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              cx={p.x}
              cy={p.y}
              fill={s.color}
            />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-muted-foreground font-medium">
              {s.label}
            </text>
            <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[10px] fill-foreground font-bold">
              {s.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// XP Reward Animation
function XpReveal({ xp }: { xp: number }) {
  if (!xp) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
      className="flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <Zap className="w-5 h-5 text-amber-500" />
      </motion.div>
      <span className="text-sm font-bold text-amber-600">+{xp} XP</span>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <PartyPopper className="w-4 h-4 text-amber-500" />
      </motion.div>
    </motion.div>
  );
}

export function TeachBackSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [session, setSession] = useState<TeachBackSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [essentials, setEssentials] = useState<TopicEssentials | null>(null);
  const [essentialsLoading, setEssentialsLoading] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<'eli5' | 'classmate' | 'expert'>('classmate');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Challenge mode state
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeMessages, setChallengeMessages] = useState<ChallengeMessage[]>([]);
  const [challengeInput, setChallengeInput] = useState('');
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [convinced, setConvinced] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const s = await teachBackService.get(id);
        setSession(s);
        if (s.userExplanation) setExplanation(s.userExplanation);
        if (s.challengeMessages?.length > 0) {
          setChallengeMessages(s.challengeMessages);
          setShowChallenge(true);
        }
      } catch {
        // Silently ignore errors
      }
      setLoading(false);
    })();
  }, [id]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [challengeMessages]);

  const loadEssentials = async () => {
    if (!id || essentials) return;
    setEssentialsLoading(true);
    try {
      setEssentials(await teachBackService.getEssentials(id));
    } catch {
      // Silently ignore errors
    }
    setEssentialsLoading(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleVoice = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('file', blob, 'recording.webm');
          const res = await api.post(ENDPOINTS.content.extractAudio, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const text = res.data?.text?.trim();
          if (text) setExplanation((prev) => (prev ? prev + ' ' + text : text));
        } catch {
          // Silently ignore errors
        }
        setIsTranscribing(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      // Silently ignore errors
    }
  };

  const handleSubmit = async () => {
    if (!id || !explanation.trim()) return;
    setSubmitting(true);
    try {
      const updated = await teachBackService.submit(id, explanation.trim(), difficultyLevel);
      setSession(updated);
    } catch {
      // Silently ignore errors
    }
    setSubmitting(false);
  };

  const handleEvaluate = async () => {
    if (!id) return;
    setEvaluating(true);
    try {
      const updated = await teachBackService.evaluate(id);
      setSession(updated);
    } catch {
      // Silently ignore errors
    }
    setEvaluating(false);
  };

  const handleRetry = () => {
    setExplanation('');
    setChallengeMessages([]);
    setShowChallenge(false);
    setConvinced(false);
    setSession((prev) => prev ? { ...prev, status: 'pending', userExplanation: null, evaluation: null, challengeMessages: [], xpAwarded: 0 } : prev);
  };

  // Challenge mode handlers
  const handleStartChallenge = async () => {
    if (!id) return;
    setChallengeLoading(true);
    setShowChallenge(true);
    try {
      const result = await teachBackService.startChallenge(id);
      setChallengeMessages(result.messages);
    } catch {
      // Silently ignore errors
    }
    setChallengeLoading(false);
  };

  const handleChallengeRespond = async () => {
    if (!id || !challengeInput.trim()) return;
    const userMsg = challengeInput.trim();
    setChallengeInput('');
    setChallengeLoading(true);
    // Optimistic add
    setChallengeMessages((prev) => [...prev, { role: 'user', content: userMsg, timestamp: new Date().toISOString() }]);
    try {
      const result = await teachBackService.respondToChallenge(id, userMsg);
      setChallengeMessages(result.messages);
      if (result.convinced) setConvinced(true);
    } catch {
      // Silently ignore errors
    }
    setChallengeLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <p className="text-muted-foreground">{t('hintMode.sessionNotFound')}</p>
        </div>
      </DashboardLayout>
    );
  }

  const eval_ = session.evaluation;
  const radarScores = eval_ ? [
    { label: 'Accuracy', value: eval_.accuracy.score, color: '#22c55e' },
    { label: 'Clarity', value: eval_.clarity.score, color: '#3b82f6' },
    { label: 'Completeness', value: eval_.completeness.score, color: '#f59e0b' },
    { label: 'Understanding', value: eval_.understanding.score, color: '#a855f7' },
  ] : [];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard/teach-back')} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-500" />
              {session.topic}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('teachBackSession.explainTopic')}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[t('teachBackSession.steps.explain'), t('teachBackSession.steps.submit'), t('teachBackSession.steps.evaluate')].map((step, i) => {
            const stepNum = session.status === 'pending' ? 0 : session.status === 'submitted' ? 1 : 2;
            const isActive = i === stepNum;
            const isDone = i < stepNum;
            return (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDone ? 'bg-violet-500 text-white' : isActive ? 'bg-violet-500/20 text-violet-500 ring-2 ring-violet-500' : 'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-violet-500' : 'text-muted-foreground'}`}>{step}</span>
                {i < 2 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-violet-500' : 'bg-muted'}`} />}
              </div>
            );
          })}
        </div>

        {/* Reference Content */}
        {session.referenceContent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-muted/30 border border-border rounded-xl p-4 mb-6">
            <p className="text-xs font-medium text-muted-foreground mb-1">{t('teachBackSession.referenceMaterial')}</p>
            <p className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{session.referenceContent}</p>
          </motion.div>
        )}

        {/* STEP 1: Explain */}
        {(session.status === 'pending') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Review Essentials Primer */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> {t('teachBackSession.reviewEssentials')}
                </p>
                {!essentials && (
                  <Button variant="outline" size="sm" onClick={loadEssentials} disabled={essentialsLoading}>
                    {essentialsLoading ? <Spinner size="sm" /> : t('teachBackSession.loadPrimer')}
                  </Button>
                )}
              </div>
              {essentials ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="text-sm">{essentials.summary}</p>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('teachBackSession.keyTerms')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {essentials.keyTerms.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-500 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('teachBackSession.watchOutFor')}</p>
                    <ul className="space-y-0.5">
                      {essentials.commonPitfalls.map((p, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs italic text-violet-500 bg-violet-500/5 p-2 rounded-lg">{essentials.examplePrompt}</p>
                </motion.div>
              ) : !essentialsLoading ? (
                <p className="text-xs text-muted-foreground">{t('teachBackSession.essentialsDesc')}</p>
              ) : null}
            </div>

            {/* Difficulty Level */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-sm font-semibold mb-3">{t('teachBackSession.whoExplainingTo')}</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'eli5' as const, label: t('teachBackSession.difficultyLevels.eli5'), emoji: '👶', desc: t('teachBackSession.difficultyLevels.eli5Desc') },
                  { value: 'classmate' as const, label: t('teachBackSession.difficultyLevels.classmate'), emoji: '🧑‍🎓', desc: t('teachBackSession.difficultyLevels.classmateDesc') },
                  { value: 'expert' as const, label: t('teachBackSession.difficultyLevels.expert'), emoji: '🎓', desc: t('teachBackSession.difficultyLevels.expertDesc') },
                ]).map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficultyLevel(d.value)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      difficultyLevel === d.value
                        ? 'bg-violet-500/10 border-2 border-violet-500 ring-1 ring-violet-500/20'
                        : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-xl">{d.emoji}</span>
                    <p className="text-xs font-medium mt-1">{d.label}</p>
                    <p className="text-[10px] text-muted-foreground">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">{t('teachBackSession.yourExplanation')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleVoice}
                    disabled={isTranscribing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isRecording
                        ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                        : isTranscribing
                          ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
                          : 'bg-muted hover:bg-muted/80 border border-border'
                    }`}
                  >
                    {isTranscribing ? (
                      <Spinner size="sm" />
                    ) : isRecording ? (
                      <MicOff className="w-3.5 h-3.5 animate-pulse" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                    {isRecording ? t('teachBackSession.stopRecording', { time: formatTime(recordingTime) }) : isTranscribing ? t('teachBackSession.transcribing') : t('teachBackSession.voice')}
                  </button>
                </div>
              </div>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder={t('teachBackSession.explanationPlaceholder')}
                className="w-full h-48 px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  {t('teachBackSession.words', { count: explanation.split(/\s+/).filter(Boolean).length })}
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={!explanation.trim() || submitting}
                >
                  {submitting ? (
                    <><Spinner size="sm" className="mr-2" /> {t('teachBackSession.submitting')}</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> {t('teachBackSession.submitExplanation')}</>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
              <p className="text-xs font-medium text-violet-500 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> {t('teachBackSession.tipsTitle')}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>- {t('teachBackSession.tips.simple')}</li>
                <li>- {t('teachBackSession.tips.examples')}</li>
                <li>- {t('teachBackSession.tips.why')}</li>
                <li>- {t('teachBackSession.tips.keyConcepts')}</li>
                <li>- {t('teachBackSession.tips.stuck')}</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Ready to Evaluate */}
        {session.status === 'submitted' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('teachBackSession.yourExplanation')}</p>
              <p className="text-sm whitespace-pre-wrap mb-4">{session.userExplanation}</p>
              <div className="flex gap-3">
                <Button onClick={handleEvaluate} disabled={evaluating} className="flex-1">
                  {evaluating ? (
                    <><Spinner size="sm" className="mr-2" /> {t('teachBackSession.aiEvaluating')}</>
                  ) : (
                    <><Target className="w-4 h-4 mr-2" /> {t('teachBackSession.evaluateExplanation')}</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleStartChallenge}
                  disabled={challengeLoading || showChallenge}
                  className="flex items-center gap-2"
                >
                  <Swords className="w-4 h-4" /> {t('teachBackSession.convinceAi')}
                </Button>
              </div>
            </div>

            {/* Challenge Chat Mode */}
            <AnimatePresence>
              {showChallenge && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card border-2 border-orange-500/30 rounded-2xl overflow-hidden">
                    {/* Challenge Header */}
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 px-5 py-3 border-b border-orange-500/20">
                      <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold">{t('teachBackSession.convinceAi')}</span>
                        {convinced && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="ml-auto flex items-center gap-1 text-xs px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full"
                          >
                            <CheckCircle className="w-3 h-3" /> {t('teachBackSession.convinced')}
                          </motion.span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('teachBackSession.skepticalDesc')}
                      </p>
                    </div>

                    {/* Chat Messages */}
                    <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                      {challengeMessages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                            msg.role === 'user'
                              ? 'bg-violet-500 text-white rounded-br-md'
                              : 'bg-muted border border-border rounded-bl-md'
                          }`}>
                            {msg.role === 'ai' && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageCircle className="w-3 h-3 text-orange-500" />
                                <span className="text-[10px] font-medium text-orange-500">{t('teachBackSession.skepticalStudent')}</span>
                              </div>
                            )}
                            {msg.content}
                          </div>
                        </motion.div>
                      ))}
                      {challengeLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted border border-border rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    {!convinced && (
                      <div className="p-3 border-t border-border">
                        <div className="flex gap-2">
                          <input
                            value={challengeInput}
                            onChange={(e) => setChallengeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChallengeRespond()}
                            placeholder={t('teachBackSession.defendUnderstanding')}
                            className="flex-1 px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            disabled={challengeLoading}
                          />
                          <Button
                            onClick={handleChallengeRespond}
                            disabled={!challengeInput.trim() || challengeLoading}
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* STEP 3: Results */}
        {session.status === 'evaluated' && eval_ && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* XP Reward */}
            <XpReveal xp={session.xpAwarded} />

            {/* Overall Score */}
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mb-3"
              >
                <span className="text-3xl font-bold text-white">{eval_.overallScore}</span>
              </motion.div>
              <p className="text-sm font-medium">{t('teachBackSession.overallScore')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {eval_.overallScore >= 80 ? t('teachBackSession.excellentUnderstanding') : eval_.overallScore >= 60 ? t('teachBackSession.goodGrasp') : t('teachBackSession.keepPracticing')}
              </p>
            </div>

            {/* Radar Chart */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-sm font-semibold mb-3 text-center">{t('teachBackSession.scoreBreakdown')}</p>
              <ScoreRadar scores={radarScores} />
            </div>

            {/* Detailed Feedback */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: 'accuracy', icon: Target, color: 'green', data: eval_.accuracy },
                { key: 'clarity', icon: Star, color: 'blue', data: eval_.clarity },
                { key: 'completeness', icon: CheckCircle, color: 'amber', data: eval_.completeness },
                { key: 'understanding', icon: TrendingUp, color: 'purple', data: eval_.understanding },
              ].map((item) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className={`w-4 h-4 text-${item.color}-500`} />
                    <span className="text-sm font-medium capitalize">{item.key}</span>
                    <span className={`ml-auto text-sm font-bold text-${item.color}-500`}>{item.data.score}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.data.score}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className={`h-full bg-${item.color}-500 rounded-full`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.data.feedback}</p>
                </motion.div>
              ))}
            </div>

            {/* Strengths */}
            {eval_.strengths.length > 0 && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                <p className="text-sm font-medium text-green-500 mb-2 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" /> {t('teachBackSession.strengths')}
                </p>
                <ul className="space-y-1">
                  {eval_.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Misconceptions */}
            {eval_.misconceptions.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm font-medium text-red-500 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> {t('teachBackSession.misconceptions')}
                </p>
                <ul className="space-y-1">
                  {eval_.misconceptions.map((m, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {eval_.suggestions.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-500 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" /> {t('teachBackSession.howToImprove')}
                </p>
                <ul className="space-y-1">
                  {eval_.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Questions */}
            {eval_.followUpQuestions.length > 0 && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-500 mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> {t('teachBackSession.deepenUnderstanding')}
                </p>
                <ul className="space-y-1.5">
                  {eval_.followUpQuestions.map((q, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <HelpCircle className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" /> {t('teachBackSession.tryAgain')}
              </Button>
              <Button onClick={() => navigate('/dashboard/teach-back')} className="flex-1">
                <GraduationCap className="w-4 h-4 mr-2" /> {t('teachBackSession.newTopic')}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default TeachBackSessionPage;
