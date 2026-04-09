import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import type { Bookmark } from '@/services/problemSolver';
import { problemSolverService } from '@/services/problemSolver';
import { ArrowLeft, BookmarkIcon, Trash2, Search } from 'lucide-react';

export function SolverBookmarksPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try { setBookmarks(await problemSolverService.getBookmarks()); } catch {
        // Silently ignore fetch errors
      }
      setLoading(false);
    })();
  }, []);

  const removeBookmark = async (sessionId: string) => {
    try {
      await problemSolverService.removeBookmark(sessionId);
      setBookmarks(prev => prev.filter(b => b.sessionId !== sessionId));
    } catch {
      // Silently ignore remove errors
    }
  };

  const filtered = bookmarks.filter(b =>
    b.problem.toLowerCase().includes(search.toLowerCase()) ||
    (b.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard/problem-solver')} className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2"><BookmarkIcon className="w-5 h-5 text-amber-500" /> {t('solverBookmarks.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('solverBookmarks.bookmarkedCount', { count: bookmarks.length })}</p>
          </div>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('solverBookmarks.searchPlaceholder')} className="w-full pl-10 pr-4 py-2.5 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50" />
        </div>
        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center text-muted-foreground">{search ? t('solverBookmarks.noMatchingSolutions') : t('solverBookmarks.noSavedSolutions')}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-card rounded-xl border p-4 hover:border-green-500/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/problem-solver/solution/${b.sessionId}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.problem}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {b.subject && <span className="text-xs px-2 py-0.5 bg-muted rounded">{b.subject}</span>}
                      {b.finalAnswer && <span className="text-xs text-green-500 font-medium">= {b.finalAnswer}</span>}
                    </div>
                    {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">{b.notes}</p>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeBookmark(b.sessionId); }} className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SolverBookmarksPage;
