import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  MessageSquare,
  Trash2,
  Clock,
  Plus,
  MessagesSquare,
} from 'lucide-react';
import { chatService } from '@/services/chat';
import type { Conversation } from '@/services/chat';

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ChatHistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const list = await chatService.listConversations();
      setConversations(list);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title?.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Conversation[]> = {};
    for (const conv of filtered) {
      const label = formatDate(conv.updatedAt || conv.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(conv);
    }
    return groups;
  }, [filtered]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await chatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpen = (conv: Conversation) => {
    navigate(`/dashboard/chat?id=${conv.id}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => navigate('/dashboard/chat')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('chatHistoryPage.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('chatHistoryPage.conversationCount', { count: conversations.length })}
            </p>
          </div>
          <div className="flex-1" />
          <Button
            onClick={() => navigate('/dashboard/chat')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('chatHistoryPage.newChat')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chatHistoryPage.searchPlaceholder')}
            className="pl-10"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="w-6 h-6" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <MessagesSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? t('chatHistoryPage.noMatchingConversations') : t('chatHistoryPage.noConversationsYet')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery
                ? t('chatHistoryPage.tryDifferentSearch')
                : t('chatHistoryPage.startChatPrompt')}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/dashboard/chat')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                {t('chatHistoryPage.startConversation')}
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, convs]) => (
              <div key={dateLabel}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  {dateLabel}
                </h3>
                <div className="space-y-2">
                  {convs.map((conv, i) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleOpen(conv)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-green-500/30 hover:bg-green-500/5 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title || t('chatHistoryPage.newChatTitle')}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(conv.updatedAt || conv.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {conv.knowledgeBaseIds?.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {t('chatHistoryPage.sourceCount', { count: conv.knowledgeBaseIds.length })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conv.id);
                        }}
                        disabled={deletingId === conv.id}
                      >
                        {deletingId === conv.id ? (
                          <Spinner className="w-3.5 h-3.5" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ChatHistoryPage;
