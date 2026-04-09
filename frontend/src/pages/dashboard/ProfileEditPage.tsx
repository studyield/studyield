import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { getLevelInfo } from '@/types';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, X, Loader2, Star } from 'lucide-react';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';

const EDUCATION_LEVEL_IDS = [
  'high_school',
  'undergraduate',
  'graduate',
  'post_graduate',
  'self_learner',
  'professional',
] as const;

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const EDUCATION_LABELS: Record<string, string> = {
    high_school: t('profileEditPage.educationLevels.0'),
    undergraduate: t('profileEditPage.educationLevels.1'),
    graduate: t('profileEditPage.educationLevels.2'),
    post_graduate: t('profileEditPage.educationLevels.3'),
    self_learner: t('profileEditPage.educationLevels.4'),
    professional: t('profileEditPage.educationLevels.5'),
  };
  const COMMON_SUBJECTS = t('profileEditPage.commonSubjects', { returnObjects: true }) as string[];
  const { user, refreshUser } = useAuth();
  const { stats, fetchGamification } = useGamificationStore();
  const levelInfo = stats ? getLevelInfo(stats.level) : null;
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchGamification(); }, [fetchGamification]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get(ENDPOINTS.users.profile);
        const data = res.data;
        setName(data.name || '');
        setAvatarUrl(data.avatarUrl || '');
        setEducationLevel(data.educationLevel || '');
        setSubjects(data.subjects || []);
      } catch {
        if (user) {
          setName(user.name || '');
          setAvatarUrl(user.avatarUrl || '');
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setAvatarUrl(dataUrl);
      await api.put(ENDPOINTS.users.profile, { avatarUrl: dataUrl });
      await refreshUser();
    } catch {
      setUploadError(t('profileEditPage.uploadFailed', { defaultValue: 'Failed to upload image. Please try again.' }));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSubject = (subject: string) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects((prev) => [...prev, trimmed]);
      setCustomSubject('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(ENDPOINTS.users.profile, {
        name: name.trim(),
        educationLevel: educationLevel || undefined,
        subjects,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently ignore save errors
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/settings')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('profileEditPage.back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('profileEditPage.title')}</h1>
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex justify-center mb-8"
        >
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full ${levelInfo ? `ring-3 ring-offset-2 ring-offset-background` : ''} flex items-center justify-center overflow-hidden`}
                style={levelInfo ? { '--tw-ring-color': 'currentColor' } as React.CSSProperties : undefined}
              >
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-green-600">
                      {name.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            {levelInfo && stats && (
              <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${levelInfo.gradient} text-white shadow-md ${levelInfo.shadow}`}>
                <Star className="w-3.5 h-3.5 fill-white" />
                {t(`gamification.levelNames.${stats.level}`, { defaultValue: levelInfo.name })} — Level {stats.level}
              </div>
            )}
            {uploadError && (
              <p className="text-xs text-red-500 text-center mt-2">{uploadError}</p>
            )}
          </div>
        </motion.div>

        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-2">{t('profileEditPage.displayName')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('profileEditPage.namePlaceholder')}
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </motion.div>

        {/* Email (read-only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-2">{t('profileEditPage.email')}</label>
          <input
            value={user?.email || ''}
            readOnly
            className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-2">{t('profileEditPage.emailCannotBeChanged')}</p>
        </motion.div>

        {/* Education Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-3">{t('profileEditPage.educationLevel')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EDUCATION_LEVEL_IDS.map((id) => (
              <button
                key={id}
                onClick={() => setEducationLevel(educationLevel === id ? '' : id)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  educationLevel === id
                    ? 'border-green-500/50 bg-green-500/5 text-green-600 dark:text-green-400'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                {EDUCATION_LABELS[id] || id}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Subjects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-3">{t('profileEditPage.subjectsOfInterest')}</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {COMMON_SUBJECTS.map((subject) => {
              const selected = subjects.includes(subject);
              return (
                <button
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selected
                      ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  {subject}
                  {selected && <X className="w-3 h-3 ml-1 inline" />}
                </button>
              );
            })}
          </div>

          {/* Custom subjects */}
          {subjects.filter((s) => !COMMON_SUBJECTS.includes(s)).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {subjects
                .filter((s) => !COMMON_SUBJECTS.includes(s))
                .map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1"
                  >
                    {s}
                    <button onClick={() => toggleSubject(s)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomSubject()}
              placeholder={t('profileEditPage.addCustomSubject')}
              className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <Button size="sm" variant="outline" onClick={addCustomSubject} disabled={!customSubject.trim()}>
              {t('profileEditPage.add')}
            </Button>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full bg-green-500 hover:bg-green-600 h-12"
          >
            {saving ? (
              <Spinner size="sm" className="mr-2" />
            ) : saved ? (
              <Check className="w-5 h-5 mr-2" />
            ) : null}
            {saving ? t('profileEditPage.saving') : saved ? t('profileEditPage.saved') : t('profileEditPage.saveChanges')}
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default ProfileEditPage;
