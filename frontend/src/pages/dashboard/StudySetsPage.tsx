import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useStudySetsStore } from '@/stores/useStudySetsStore';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import {
  Plus,
  Search,
  Library,
  BookOpen,
  FileText,
  MoreVertical,
  Trash2,
  Edit,
  Globe,
  Lock,
} from 'lucide-react';
import type { StudySet } from '@/types';

function StudySetCard({ studySet, onDelete }: { studySet: StudySet; onDelete: (id: string) => void }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 hover:border-green-500/50 transition-colors group h-[140px] flex flex-col"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {studySet.coverImageUrl ? (
            <img
              src={studySet.coverImageUrl}
              alt={studySet.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Library className="w-6 h-6 text-green-500" />
            </div>
          )}
          <div>
            <Link
              to={`/dashboard/study-sets/${studySet.id}`}
              className="font-semibold hover:text-green-500 transition-colors"
            >
              {studySet.title}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              {studySet.isPublic ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  {t('studySets.public')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  {t('studySets.private')}
                </span>
              )}
              {studySet.description?.toLowerCase().includes('imported') && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                  {t('studySets.imported')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-lg z-50">
                <Link
                  to={`/dashboard/study-sets/${studySet.id}/edit`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  {t('common.edit')}
                </Link>
                <button
                  onClick={() => {
                    onDelete(studySet.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {studySet.description && !studySet.description.toLowerCase().includes('imported') && (
        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
          {studySet.description}
        </p>
      )}

      {/* Spacer to push content to bottom */}
      <div className="flex-1" />

      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          {t('studySets.flashcardsCount', { count: studySet.flashcardsCount })}
        </span>
        {studySet.documentsCount > 0 && (
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {t('studySets.docsCount', { count: studySet.documentsCount })}
          </span>
        )}
        {studySet.tags.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            {studySet.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {studySet.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{studySet.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function StudySetsPage() {
  const { t } = useTranslation();
  const { studySets, isLoading, error, fetchStudySets, deleteStudySet } = useStudySetsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studySetToDelete, setStudySetToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchStudySets();
  }, [fetchStudySets]);

  const filteredStudySets = studySets.filter((set) =>
    set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    set.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    set.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (id: string) => {
    setStudySetToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studySetToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStudySet(studySetToDelete);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setStudySetToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t('studySets.title')}</h1>
            <p className="text-muted-foreground">
              {t('studySets.description')}
            </p>
          </div>
          <Button className="bg-green-500 hover:bg-green-600" asChild>
            <Link to="/dashboard/study-sets/create">
              <Plus className="w-4 h-4 mr-2" />
              {t('studySets.create')}
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && studySets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Library className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('studySets.noSets')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('studySets.createFirst')}
            </p>
            <Button className="bg-green-500 hover:bg-green-600" asChild>
              <Link to="/dashboard/study-sets/create">
                <Plus className="w-4 h-4 mr-2" />
                {t('studySets.create')}
              </Link>
            </Button>
          </div>
        )}

        {/* No results */}
        {!isLoading && studySets.length > 0 && filteredStudySets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('studySets.noResultsFor', { query: searchQuery })}
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && filteredStudySets.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudySets.map((studySet) => (
              <StudySetCard
                key={studySet.id}
                studySet={studySet}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title={t('studySets.delete')}
        description={t('studySets.deleteConfirm')}
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
