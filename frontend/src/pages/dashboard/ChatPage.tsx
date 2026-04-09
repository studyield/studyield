import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  History,
  BookOpen,
  Sparkles,
  X,
  ChevronDown,
  FileText,
  Copy,
  Check,
  Bot,
  User,
  MessageSquare,
  ArrowDown,
  Paperclip,
} from 'lucide-react';
import { chatService } from '@/services/chat';
import type { Conversation, Message, Citation, StreamChunk } from '@/services/chat';

const SUGGESTED_QUESTION_KEYS = [
  'chat.suggestedQ1',
  'chat.suggestedQ2',
  'chat.suggestedQ3',
  'chat.suggestedQ4',
  'chat.suggestedQ5',
  'chat.suggestedQ6',
];

function CitationBadge({
  index,
  onClick,
  sourceLabel,
}: {
  index: number;
  onClick: () => void;
  sourceLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold hover:bg-green-500/30 transition-colors cursor-pointer align-super ml-0.5"
      title={sourceLabel}
    >
      {index + 1}
    </button>
  );
}

function CitationPanel({
  citation,
  index,
  onClose,
}: {
  citation: Citation;
  index: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="border border-border rounded-xl bg-card p-4 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-green-600 dark:text-green-400">{index + 1}</span>
          </div>
          <span className="text-sm font-medium">{t('chat.source', { index: index + 1 })}</span>
          {citation.score > 0 && (
            <span className="text-xs text-muted-foreground">
              {t('chat.relevant', { score: Math.round(citation.score * 100) })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto leading-relaxed">
        {citation.content}
      </div>
      {citation.documentId && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <FileText className="w-3 h-3" />
          <span>{t('chat.fromDocument')}</span>
        </div>
      )}
    </motion.div>
  );
}

function MessageBubble({
  message,
  onCitationClick,
}: {
  message: Message & { isStreaming?: boolean };
  onCitationClick: (citation: Citation, index: number) => void;
}) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    if (!message.citations?.length) {
      return <span className="whitespace-pre-wrap">{message.content}</span>;
    }

    // Replace citation markers [1], [2] etc with clickable badges
    const parts = message.content.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const citIndex = parseInt(match[1], 10) - 1;
        const citation = message.citations[citIndex];
        if (citation) {
          return (
            <CitationBadge
              key={i}
              index={citIndex}
              citation={citation}
              onClick={() => onCitationClick(citation, citIndex)}
              sourceLabel={t('chat.source', { index: citIndex + 1 })}
            />
          );
        }
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-green-600 text-white rounded-br-md'
              : 'bg-muted rounded-bl-md'
          }`}
        >
          {renderContent()}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-green-500 rounded-full animate-pulse ml-1 align-text-bottom" />
          )}
        </div>
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-1 mt-1 ml-1">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={handleCopy}>
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? t('common.copied') : t('common.copy')}
            </Button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}

export function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('id');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const [activeCitation, setActiveCitation] = useState<{ citation: Citation; index: number } | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations list
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation from URL param
  useEffect(() => {
    if (conversationIdParam) {
      loadConversation(conversationIdParam);
    }
  }, [conversationIdParam]);

  const loadConversations = async () => {
    setSidebarLoading(true);
    try {
      const list = await chatService.listConversations();
      setConversations(list);
    } catch {
      // silently fail
    } finally {
      setSidebarLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    setIsLoading(true);
    try {
      const [conv, msgs] = await Promise.all([
        chatService.getConversation(id),
        chatService.getMessages(id),
      ]);
      setCurrentConversation(conv);
      setMessages(msgs);
      setTimeout(() => scrollToBottom(), 100);
    } catch {
      // conversation might be deleted
      navigate('/dashboard/chat', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Track scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNewConversation = async () => {
    setCurrentConversation(null);
    setMessages([]);
    setActiveCitation(null);
    navigate('/dashboard/chat', { replace: true });
    inputRef.current?.focus();
  };

  const handleSelectConversation = (conv: Conversation) => {
    navigate(`/dashboard/chat?id=${conv.id}`, { replace: true });
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversation?.id === id) {
        handleNewConversation();
      }
    } catch {
      // silently fail
    }
  };

  const handleSend = async (content?: string) => {
    const text = (content || input).trim();
    if (!text || isSending) return;

    setInput('');
    setIsSending(true);
    setActiveCitation(null);

    // Create conversation if needed
    let convId = currentConversation?.id;
    if (!convId) {
      try {
        const newConv = await chatService.createConversation({
          title: text.slice(0, 100),
        });
        setCurrentConversation(newConv);
        setConversations((prev) => [newConv, ...prev]);
        convId = newConv.id;
        navigate(`/dashboard/chat?id=${newConv.id}`, { replace: true });
      } catch {
        setIsSending(false);
        return;
      }
    }

    // Add user message to UI
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content: text,
      citations: [],
      metadata: {},
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => scrollToBottom(), 50);

    // Stream response
    setStreamingContent('');
    setStreamingCitations([]);
    const controller = new AbortController();
    abortRef.current = controller;

    let fullContent = '';
    const collectedCitations: Citation[] = [];
    let doneMessageId = '';

    try {
      await chatService.sendMessageStream(
        convId,
        text,
        (chunk: StreamChunk) => {
          if (chunk.type === 'content') {
            fullContent += chunk.data as string;
            setStreamingContent(fullContent);
            scrollToBottom();
          } else if (chunk.type === 'citation') {
            collectedCitations.push(chunk.data as Citation);
            setStreamingCitations([...collectedCitations]);
          } else if (chunk.type === 'done') {
            const doneData = chunk.data as { messageId?: string } | null;
            doneMessageId = doneData?.messageId || `msg-${Date.now()}`;
          }
        },
        controller.signal
      );
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        // cancelled
      } else {
        fullContent = fullContent || t('chat.errorFallback');
      }
    }

    // Finalize: add assistant message
    const assistantMsg: Message = {
      id: doneMessageId || `msg-${Date.now()}`,
      conversationId: convId,
      role: 'assistant',
      content: fullContent,
      citations: collectedCitations,
      metadata: {},
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setStreamingContent('');
    setStreamingCitations([]);
    setIsSending(false);
    abortRef.current = null;

    // Update conversation title if first message
    if (messages.length === 0) {
      loadConversations();
    }

    scrollToBottom();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStopStream = () => {
    abortRef.current?.abort();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-7rem)] -m-4 lg:-m-6">
        {/* Conversation Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-border bg-card flex flex-col overflow-hidden flex-shrink-0"
            >
              {/* Sidebar Header */}
              <div className="p-3 border-b border-border flex items-center gap-2">
                <Button
                  onClick={handleNewConversation}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {t('chat.newChat')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => navigate('/dashboard/chat/history')}
                  title={t('chat.chatHistory')}
                >
                  <History className="w-4 h-4" />
                </Button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sidebarLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="w-5 h-5" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {t('chat.noChatHistory')}
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group flex items-center gap-2 ${
                        currentConversation?.id === conv.id
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
                      <span className="truncate flex-1">{conv.title || t('chat.newChat')}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="h-12 border-b border-border flex items-center px-4 gap-3 bg-card/50">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showSidebar ? 'rotate-90' : '-rotate-90'}`} />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {currentConversation?.title || t('chat.newConversation')}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 relative">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Spinner className="w-6 h-6" />
              </div>
            ) : messages.length === 0 && !streamingContent ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6"
                >
                  <Bot className="w-8 h-8 text-green-500" />
                </motion.div>
                <h2 className="text-xl font-semibold mb-2">{t('chat.studyBuddy')}</h2>
                <p className="text-sm text-muted-foreground mb-8">
                  {t('chat.emptyDescription')}
                </p>

                {/* Suggested Questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {SUGGESTED_QUESTION_KEYS.slice(0, 4).map((key, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      onClick={() => handleSend(t(key))}
                      className="text-left px-4 py-3 rounded-xl border border-border hover:border-green-500/50 hover:bg-green-500/5 transition-all text-sm group"
                    >
                      <div className="flex flex-row items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-left">
                          {t(key)}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onCitationClick={(citation, index) =>
                      setActiveCitation({ citation, index })
                    }
                  />
                ))}

                {/* Streaming message */}
                {streamingContent && (
                  <MessageBubble
                    message={{
                      id: 'streaming',
                      conversationId: '',
                      role: 'assistant',
                      content: streamingContent,
                      citations: streamingCitations,
                      metadata: {},
                      createdAt: new Date().toISOString(),
                      isStreaming: true,
                    } as Message & { isStreaming: boolean }}
                    onCitationClick={(citation, index) =>
                      setActiveCitation({ citation, index })
                    }
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Citation Panel */}
          <AnimatePresence>
            {activeCitation && (
              <div className="px-4 pb-2">
                <CitationPanel
                  citation={activeCitation.citation}
                  index={activeCitation.index}
                  onClose={() => setActiveCitation(null)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Scroll Down Button */}
          <AnimatePresence>
            {showScrollDown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full shadow-lg"
                  onClick={scrollToBottom}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-card/50">
            <div className="max-w-3xl mx-auto">
              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-sm border border-border"
                    >
                      <FileText className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(i)}
                        className="p-0.5 hover:bg-background rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {/* File Upload Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-[44px] w-[44px] p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted flex-shrink-0"
                  title={t('chat.uploadFile')}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat.placeholder')}
                    rows={1}
                    disabled={isSending}
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-50 min-h-[44px] max-h-[120px]"
                    style={{
                      height: 'auto',
                      minHeight: '44px',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                {isSending ? (
                  <Button
                    onClick={handleStopStream}
                    size="sm"
                    variant="outline"
                    className="h-[44px] w-[44px] p-0 rounded-xl border-red-500/50 text-red-500 hover:bg-red-500/10 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSend()}
                    size="sm"
                    disabled={!input.trim()}
                    className="h-[44px] w-[44px] p-0 rounded-xl bg-green-600 hover:bg-green-700 text-white disabled:opacity-30 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                {t('chat.disclaimer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ChatPage;
