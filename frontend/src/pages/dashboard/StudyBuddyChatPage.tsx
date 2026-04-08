import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useProblemSolverStore } from '@/stores/useProblemSolverStore';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import {
  ArrowLeft,
  Send,
  Mic,
  Bot,
  User,
  Lightbulb,
  BookOpen,
  Download,
  Copy,
  Check,
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'Can you explain step 2 in more detail?',
  'Why did we use this approach?',
  'What are other methods to solve this?',
  'Can you give me a simpler example?',
  'What concepts do I need to understand this?',
];

// Render text with inline LaTeX
function ChatMath({ text }: { text: string }) {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  // Match $$...$$ for block and $...$ for inline
  const segments = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);

  segments.forEach((seg, i) => {
    if (seg.startsWith('$$') && seg.endsWith('$$')) {
      const latex = seg.slice(2, -2);
      try {
        parts.push(
          <div key={i} className="my-2 overflow-x-auto">
            <BlockMath math={latex} />
          </div>,
        );
      } catch {
        parts.push(<code key={i} className="bg-muted px-1 rounded text-sm">{latex}</code>);
      }
    } else if (seg.startsWith('$') && seg.endsWith('$')) {
      const latex = seg.slice(1, -1);
      try {
        parts.push(<InlineMath key={i} math={latex} />);
      } catch {
        parts.push(<code key={i} className="bg-muted px-1 rounded text-sm">{latex}</code>);
      }
    } else {
      // Handle code blocks
      const codeParts = seg.split(/(```[\s\S]*?```)/g);
      codeParts.forEach((cp, j) => {
        if (cp.startsWith('```') && cp.endsWith('```')) {
          const code = cp.slice(3, -3).replace(/^\w+\n/, '');
          parts.push(
            <pre key={`${i}-${j}`} className="bg-zinc-950 text-zinc-100 rounded-lg p-3 my-2 text-sm font-mono overflow-x-auto">
              <code>{code}</code>
            </pre>,
          );
        } else {
          parts.push(<span key={`${i}-${j}`}>{cp}</span>);
        }
      });
    }
  });

  return <>{parts}</>;
}

export function StudyBuddyChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    currentSession,
    chatMessages,
    isChatLoading,
    fetchSession,
    fetchChatMessages,
    sendChatMessage,
  } = useProblemSolverStore();
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    if (!currentSession || currentSession.id !== id) {
      fetchSession(id);
    }
    fetchChatMessages(id);
  }, [id, currentSession, fetchSession, fetchChatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || !id) return;
    const msg = input.trim();
    setInput('');
    await sendChatMessage(id, msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = async (q: string) => {
    if (!id || isChatLoading) return;
    setInput('');
    await sendChatMessage(id, q);
  };

  const copyMessage = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportChat = () => {
    const text = chatMessages
      .map((m) => `[${m.role === 'user' ? 'You' : 'Study Buddy'}]: ${m.message}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-buddy-chat.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/dashboard/problem-solver/solution/${id}`)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h1 className="text-sm font-bold">{t('studyBuddyChat.title')}</h1>
                  <p className="text-xs text-muted-foreground">
                    {t('studyBuddyChat.subtitle')}
                  </p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={exportChat}>
              <Download className="w-4 h-4 mr-1" />
              {t('studyBuddyChat.export')}
            </Button>
          </div>

          {/* Problem context */}
          {currentSession && (
            <div className="mt-3 bg-muted/30 rounded-xl p-3 flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground line-clamp-2">
                <span className="font-medium">{t('studyBuddyChat.problem')}</span>{' '}
                {currentSession.problem}
              </p>
            </div>
          )}
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
          {/* Welcome message */}
          {chatMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-green-500" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-md p-4 max-w-[85%]">
                <p className="text-sm">
                  {t('studyBuddyChat.welcomeMessage')}
                </p>
              </div>
            </motion.div>
          )}

          {chatMessages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-green-500" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-green-500 text-white rounded-tr-md'
                    : 'bg-card border border-border rounded-tl-md'
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.role === 'user' ? msg.message : <ChatMath text={msg.message} />}
                </div>
                {msg.role !== 'user' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => copyMessage(msg.message)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === msg.message ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isChatLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-green-500" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {chatMessages.length < 2 && (
          <div className="shrink-0 mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-muted-foreground font-medium">
                {t('studyBuddyChat.suggestedQuestions')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-3 py-1.5 bg-muted/50 border border-border rounded-full text-xs hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 bg-card border border-border rounded-2xl p-3 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('studyBuddyChat.askFollowUp')}
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-32 min-h-[36px]"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            className="shrink-0 w-9 h-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudyBuddyChatPage;
