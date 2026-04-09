import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useProblemSolverStore } from '@/stores/useProblemSolverStore';
import type { AlternativeMethod } from '@/services/problemSolver';
import { problemSolverService } from '@/services/problemSolver';
import { InteractiveGraph } from '@/components/problem-solver/InteractiveGraph';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import {
  ListOrdered,
  Code2,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Lightbulb,
  Play,
  Terminal,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Brain,
  Zap,
  Shuffle,
  Volume2,
  VolumeX,
  GraduationCap,
  Map,
  FlipVertical,
  ClipboardList,
  Gauge,
} from 'lucide-react';

type Tab = 'steps' | 'code' | 'citations' | 'alternatives';

// Deep extract: recursively unwrap JSON until we get actual text
function deepExtractText(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);

  // If it's an object, try to get the "output" or "content" field
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    // Has "output" field - recurse into it
    if (obj.output !== undefined) return deepExtractText(obj.output);
    if (obj.content !== undefined) return deepExtractText(obj.content);
    // It's a plain object like {"Given information": "...", "Key concepts": "..."}
    // Format it as readable text
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => {
        if (Array.isArray(v)) return `**${k}:** ${v.join(', ')}`;
        if (typeof v === 'object') return `**${k}:** ${JSON.stringify(v)}`;
        return `**${k}:** ${v}`;
      })
      .join('\n\n');
  }

  if (typeof raw !== 'string') return String(raw);

  // Try parsing as JSON
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return deepExtractText(parsed);
    }
  } catch {
    // Not JSON, use as-is
  }
  return raw;
}

// Extract actual text content from agent output
function extractAgentOutput(raw: unknown): string {
  return deepExtractText(raw);
}

// Extract metadata from agent result (could be AgentStep or raw JSON in output)
function extractMetadata(step: { output?: unknown; confidence?: number } | null): {
  finalAnswer?: string;
  confidence?: number;
  stepsCount?: number;
  isCorrect?: boolean;
} {
  if (!step) return {};

  // Try to find metadata by parsing through the output chain
  const findMeta = (val: unknown): Record<string, unknown> | null => {
    if (!val) return null;
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      if (obj.metadata) return obj.metadata as Record<string, unknown>;
      if (obj.output) return findMeta(obj.output);
      return null;
    }
    if (typeof val === 'string') {
      try {
        return findMeta(JSON.parse(val));
      } catch {
        return null;
      }
    }
    return null;
  };

  const findConfidence = (val: unknown): number | null => {
    if (!val) return null;
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      if (typeof obj.confidence === 'number') return obj.confidence;
      if (obj.output) return findConfidence(obj.output);
      return null;
    }
    if (typeof val === 'string') {
      try {
        return findConfidence(JSON.parse(val));
      } catch {
        return null;
      }
    }
    return null;
  };

  const meta = findMeta(step.output) || {};
  const confidence = findConfidence(step.output) ?? step.confidence;

  return { ...meta, confidence } as {
    finalAnswer?: string;
    confidence?: number;
    stepsCount?: number;
    isCorrect?: boolean;
  };
}

// Normalize LaTeX delimiters: convert \(...\) to $...$ and \[...\] to $$...$$
function normalizeLatex(text: unknown): string {
  if (!text) return '';
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  return str
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');
}

// Parse text with LaTeX and render it
function RenderMath({ text }: { text: unknown }) {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  // Normalize \(...\) and \[...\] to $...$ and $$...$$
  let remaining = normalizeLatex(text);
  let key = 0;

  // Process block math $$...$$
  while (remaining.length > 0) {
    const blockStart = remaining.indexOf('$$');
    if (blockStart === -1) {
      // No more block math, process inline
      parts.push(<RenderInlineMath key={key++} text={remaining} />);
      break;
    }

    // Text before block math
    if (blockStart > 0) {
      parts.push(
        <RenderInlineMath key={key++} text={remaining.slice(0, blockStart)} />,
      );
    }

    const blockEnd = remaining.indexOf('$$', blockStart + 2);
    if (blockEnd === -1) {
      parts.push(<RenderInlineMath key={key++} text={remaining.slice(blockStart)} />);
      break;
    }

    const latex = remaining.slice(blockStart + 2, blockEnd);
    try {
      // eslint-disable-next-line react-hooks/error-boundaries
      parts.push(
        <div key={key++} className="my-2 overflow-x-auto">
          <BlockMath math={latex} />
        </div>,
      );
    } catch {
      parts.push(
        <code key={key++} className="text-sm bg-muted px-1 rounded">
          {latex}
        </code>,
      );
    }
    remaining = remaining.slice(blockEnd + 2);
  }

  return <>{parts}</>;
}

function RenderInlineMath({ text }: { text: string }) {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  // Match $...$ (but not $$)
  const regex = /\$([^$]+)\$/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    try {
      {/* eslint-disable-next-line react-hooks/error-boundaries */}
      parts.push(<InlineMath key={match.index} math={match[1]} />);
    } catch {
      parts.push(
        <code key={match.index} className="text-sm bg-muted px-1 rounded">
          {match[1]}
        </code>,
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return <>{parts}</>;
}

// Parse solution output into steps
function parseSolutionSteps(output: string): { title: string; content: string }[] {
  if (!output) return [];

  // Try to split by "Step N:" pattern
  const stepRegex = /(?:Step\s+\d+[:.]\s*|^\d+[.)]\s+)/gim;
  const splits = output.split(stepRegex).filter(Boolean);

  if (splits.length > 1) {
    return splits.map((content, i) => ({
      title: `Step ${i + 1}`,
      content: content.trim(),
    }));
  }

  // Fallback: split by double newlines
  const paragraphs = output.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length > 1) {
    return paragraphs.map((content, i) => ({
      title: `Step ${i + 1}`,
      content: content.trim(),
    }));
  }

  return [{ title: 'Solution', content: output }];
}

// Extract code blocks from solution
function extractCodeBlocks(
  text: string,
): { language: string; code: string; description: string }[] {
  const blocks: { language: string; code: string; description: string }[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'python',
      code: match[2].trim(),
      description: '',
    });
  }
  return blocks;
}

export function SolutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentSession, fetchSession, isLoading, fetchSimilarProblems } =
    useProblemSolverStore();
  const [activeTab, setActiveTab] = useState<Tab>('steps');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // New feature states
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [altMethods, setAltMethods] = useState<AlternativeMethod[]>([]);
  const [altLoading, setAltLoading] = useState(false);
  const [complexityLevel, setComplexityLevel] = useState('intermediate');
  const [eli5Explanation, setEli5Explanation] = useState<string | null>(null);
  const [eli5Loading, setEli5Loading] = useState(false);
  const [narrationText, setNarrationText] = useState<string | null>(null);
  const [narrationLoading, setNarrationLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (id && (!currentSession || currentSession.id !== id)) {
      fetchSession(id);
    }
  }, [id, currentSession, fetchSession]);

  // Check bookmark status
  useEffect(() => {
    if (id) {
      problemSolverService.isBookmarked(id).then(setIsBookmarked).catch(() => {});
    }
  }, [id]);

  // Auto-load alt methods when tab is clicked
  useEffect(() => {
    if (activeTab === 'alternatives') {
      loadAlternativeMethods();
    }
  }, [activeTab]);

  const toggleBookmark = async () => {
    if (!id) return;
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await problemSolverService.removeBookmark(id);
        setIsBookmarked(false);
      } else {
        await problemSolverService.addBookmark(id);
        setIsBookmarked(true);
      }
    } catch {
      // Silently ignore bookmark errors
    }
    setBookmarkLoading(false);
  };

  const loadAlternativeMethods = async () => {
    if (!id || altMethods.length > 0) return;
    setAltLoading(true);
    try {
      setAltMethods(await problemSolverService.getAlternativeMethods(id));
    } catch {
      // Silently ignore fetch errors
    }
    setAltLoading(false);
  };

  const changeComplexity = async (level: string) => {
    if (!id) return;
    setComplexityLevel(level);
    setEli5Loading(true);
    try {
      const res = await problemSolverService.explainAtLevel(id, level);
      setEli5Explanation(res.explanation);
    } catch {
      // Silently ignore fetch errors
    }
    setEli5Loading(false);
  };

  const loadNarration = async () => {
    if (!id) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (narrationText) {
      const utterance = new SpeechSynthesisUtterance(narrationText);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      return;
    }
    setNarrationLoading(true);
    try {
      const res = await problemSolverService.getNarration(id);
      setNarrationText(res.narration);
      const utterance = new SpeechSynthesisUtterance(res.narration);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } catch {
      // Silently ignore narration errors
    }
    setNarrationLoading(false);
  };

  const session = currentSession;
  const solutionOutput = extractAgentOutput(session?.solutionResult?.output);
  const analysisOutput = extractAgentOutput(session?.analysisResult?.output);
  const verificationOutput = extractAgentOutput(session?.verificationResult?.output);

  // Extract real final answer from metadata
  const verifierMeta = extractMetadata(session?.verificationResult || null);
  const solverMeta = extractMetadata(session?.solutionResult || null);
  const realFinalAnswer =
    verifierMeta.finalAnswer || solverMeta.finalAnswer || session?.finalAnswer || null;

  const steps = parseSolutionSteps(solutionOutput);
  const codeBlocks = extractCodeBlocks(solutionOutput + '\n' + analysisOutput);

  const toggleStep = (idx: number) => {
    const next = new Set(expandedSteps);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExpandedSteps(next);
  };

  const copyToClipboard = async (text: string, stepIdx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedStep(stepIdx);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const runCode = async (_code: string) => {
    setIsRunning(true);
    setCodeOutput(null);
    try {
      // In production, this would call the code sandbox API
      setCodeOutput('Code execution requires a running sandbox server.\nOutput will appear here.');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading || !session) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'steps', label: t('solution.tabs.solutionSteps'), icon: ListOrdered },
    { key: 'alternatives', label: t('solution.tabs.altMethods'), icon: Shuffle },
    { key: 'code', label: t('solution.tabs.code'), icon: Code2 },
    { key: 'citations', label: t('solution.tabs.citations'), icon: BookOpen },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/dashboard/problem-solver')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('solution.backToProblemSolver')}
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{t('solution.title')}</h1>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-sm">
                  <RenderMath text={session.problem} />
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {session.subject && (
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full text-xs font-medium">
                      {session.subject}
                    </span>
                  )}
                  {session.isCorrect !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        session.isCorrect
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {session.isCorrect ? t('solution.verifiedCorrect') : t('solution.needsReview')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 mr-1 text-amber-500" />
                ) : (
                  <Bookmark className="w-4 h-4 mr-1" />
                )}
                {isBookmarked ? t('solution.saved') : t('solution.save')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/dashboard/problem-solver/chat/${id}`)}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {t('solution.chat')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchSimilarProblems(id!);
                  navigate(`/dashboard/problem-solver/similar/${id}`);
                }}
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                {t('solution.similar')}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Final Answer Card */}
        {realFinalAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-sm">{t('solution.finalAnswer')}</span>
            </div>
            <div className="text-lg font-medium">
              <RenderMath text={realFinalAnswer} />
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/problem-solver/hint/${id}`)}
            >
              <GraduationCap className="w-4 h-4 mr-1.5 text-amber-500" />
              {t('solution.guideMe')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/problem-solver/quiz/${id}`)}
            >
              <ClipboardList className="w-4 h-4 mr-1.5 text-purple-500" />
              {t('solution.practiceQuiz')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/problem-solver/concept-map/${id}`)}
            >
              <Map className="w-4 h-4 mr-1.5 text-blue-500" />
              {t('solution.conceptMap')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/problem-solver/formula-cards/${id}`)}
            >
              <FlipVertical className="w-4 h-4 mr-1.5 text-green-500" />
              {t('solution.formulaCards')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadNarration}
              disabled={narrationLoading}
            >
              {narrationLoading ? (
                <Spinner size="sm" className="mr-1.5" />
              ) : isSpeaking ? (
                <VolumeX className="w-4 h-4 mr-1.5 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4 mr-1.5 text-orange-500" />
              )}
              {isSpeaking ? t('solution.stopNarration') : t('solution.narrate')}
            </Button>
          </div>
        </motion.div>

        {/* ELI5 Complexity Slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="bg-card border border-border rounded-xl p-4 mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Gauge className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">{t('solution.explanationLevel')}</span>
          </div>
          <div className="flex gap-2">
            {['eli5', 'beginner', 'intermediate', 'advanced'].map((level) => (
              <button
                key={level}
                onClick={() => changeComplexity(level)}
                disabled={eli5Loading}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  complexityLevel === level
                    ? 'bg-purple-500 text-white'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {t(`solution.${level}`)}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {eli5Loading && (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}
            {eli5Explanation && !eli5Loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-muted/30 rounded-lg text-sm"
              >
                <RenderMath text={eli5Explanation} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Interactive Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.095 }}
          className="mb-6"
        >
          <InteractiveGraph sessionId={id!} />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                  activeTab === tab.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: Steps */}
          {activeTab === 'steps' && (
            <div className="space-y-3">
              {/* Analysis summary */}
              {analysisOutput && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold">{t('solution.problemAnalysis')}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <RenderMath text={analysisOutput} />
                  </div>
                </div>
              )}

              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleStep(idx)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-green-500">
                        {idx + 1}
                      </span>
                    </div>
                    <span className="font-medium text-sm flex-1">{step.title}</span>
                    {expandedSteps.has(idx) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {expandedSteps.has(idx) && (
                    <div className="px-4 pb-4 border-t border-border">
                      <div className="pt-3 text-sm leading-relaxed">
                        <RenderMath text={step.content} />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => copyToClipboard(step.content, idx)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedStep === idx ? (
                            <>
                              <Check className="w-3 h-3 text-green-500" />
                              {t('solution.copied')}
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              {t('solution.copy')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Verification summary */}
              {verificationOutput && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold">{t('solution.verification')}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <RenderMath text={verificationOutput} />
                  </div>
                </div>
              )}

              {/* Copy entire solution */}
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(solutionOutput, -1)}
                >
                  {copiedStep === -1 ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                      {t('solution.copiedFull')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      {t('solution.copyEntireSolution')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Tab Content: Code */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              {codeBlocks.length > 0 ? (
                codeBlocks.map((block, idx) => (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium uppercase">
                          {block.language}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(block.code, 100 + idx)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {copiedStep === 100 + idx ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {t('solution.copy')}
                        </button>
                        <button
                          onClick={() => runCode(block.code)}
                          disabled={isRunning}
                          className="flex items-center gap-1 text-xs text-green-500 hover:text-green-600 font-medium"
                        >
                          <Play className="w-3 h-3" />
                          {t('solution.run')}
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 text-sm font-mono overflow-x-auto bg-zinc-950 text-zinc-100">
                      <code>{block.code}</code>
                    </pre>

                    {/* Execution output */}
                    {codeOutput && (
                      <div className="border-t border-border">
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
                          <Terminal className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{t('solution.output')}</span>
                        </div>
                        <pre className="p-4 text-sm font-mono text-muted-foreground bg-muted/10 max-h-48 overflow-y-auto">
                          {codeOutput}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Code2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('solution.noCodeBlocks')}</p>
                  <p className="text-xs mt-1">
                    {t('solution.noCodeBlocksDesc')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Alternative Methods */}
          {activeTab === 'alternatives' && (
            <div className="space-y-4">
              {altMethods.length === 0 && !altLoading && (
                <div className="text-center py-8">
                  <Shuffle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('solution.discoverMethods')}
                  </p>
                  <Button onClick={loadAlternativeMethods}>
                    <Shuffle className="w-4 h-4 mr-2" />
                    {t('solution.generateAltMethods')}
                  </Button>
                </div>
              )}
              {altLoading && (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              )}
              {altMethods.map((method, idx) => (
                <motion.div
                  key={method.id || idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-500">{idx + 1}</span>
                    </div>
                    <span className="font-medium text-sm">{method.methodName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{method.methodDescription}</p>
                  <div className="text-sm bg-muted/30 rounded-lg p-3">
                    <RenderMath text={extractAgentOutput(method.solutionSteps?.output)} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tab Content: Citations */}
          {activeTab === 'citations' && (
            <div className="space-y-3">
              {/* Generated references based on the problem */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold">{t('solution.solutionSources')}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('solution.aiAnalysisAgent')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('solution.aiAnalysisAgentDesc')}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="h-1.5 w-20 bg-blue-500/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${(extractMetadata(session.analysisResult).confidence ?? 0.9) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {((extractMetadata(session.analysisResult).confidence ?? 0.9) * 100) | 0}% {t('solution.confidence')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('solution.aiSolverAgent')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('solution.aiSolverAgentDesc')}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="h-1.5 w-20 bg-amber-500/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${(extractMetadata(session.solutionResult).confidence ?? 0.9) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {((extractMetadata(session.solutionResult).confidence ?? 0.9) * 100) | 0}% {t('solution.confidence')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('solution.aiVerifierAgent')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('solution.aiVerifierAgentDesc')}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="h-1.5 w-20 bg-green-500/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{
                              width: `${(extractMetadata(session.verificationResult).confidence ?? 0.9) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {((extractMetadata(session.verificationResult).confidence ?? 0.9) * 100) | 0}%
                          {t('solution.confidence')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  {t('solution.citationsDisclaimer')}
                  <br />
                  {t('solution.citationsDisclaimerSub')}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default SolutionPage;
