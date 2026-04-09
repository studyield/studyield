import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Trash2,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  // Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError(t('accountSettingsPage.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('accountSettingsPage.passwordsDoNotMatch'));
      return;
    }

    setChangingPassword(true);
    try {
      await api.post(ENDPOINTS.auth.changePassword, {
        oldPassword,
        newPassword,
      });
      setPasswordChanged(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChanged(false), 3000);
    } catch {
      setPasswordError(t('accountSettingsPage.incorrectPassword'));
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete(ENDPOINTS.users.profile);
      await logout();
      navigate('/');
    } catch {
      // Silently ignore delete errors
    }
    setDeleting(false);
  };

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
            {t('accountSettingsPage.back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('accountSettingsPage.title')}</h1>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t('accountSettingsPage.changePassword')}</p>
              <p className="text-xs text-muted-foreground">{t('accountSettingsPage.changePasswordDesc')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Old password */}
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('accountSettingsPage.currentPassword')}
                className="w-full px-4 py-3 pr-10 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* New password */}
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('accountSettingsPage.newPassword')}
                className="w-full px-4 py-3 pr-10 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm */}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('accountSettingsPage.confirmNewPassword')}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />

            {passwordError && (
              <p className="text-xs text-red-500">{passwordError}</p>
            )}

            {passwordChanged && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <Check className="w-3 h-3" /> {t('accountSettingsPage.passwordChangedSuccess')}
              </p>
            )}

            <Button
              onClick={handleChangePassword}
              disabled={!oldPassword || !newPassword || !confirmPassword || changingPassword}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {changingPassword ? <Spinner size="sm" className="mr-2" /> : null}
              {changingPassword ? t('accountSettingsPage.changing') : t('accountSettingsPage.changePasswordBtn')}
            </Button>
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <p className="text-sm font-semibold mb-3">{t('accountSettingsPage.accountInfo')}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">{t('accountSettingsPage.emailLabel')}</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">{t('accountSettingsPage.planLabel')}</span>
              <span className="capitalize">{user?.plan}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">{t('accountSettingsPage.emailVerified')}</span>
              <span>{user?.emailVerified ? t('accountSettingsPage.yes') : t('accountSettingsPage.no')}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">{t('accountSettingsPage.memberSince')}</span>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
            </div>
          </div>
        </motion.div>

        {/* Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-red-500/20 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-500">{t('accountSettingsPage.deleteAccount')}</p>
              <p className="text-xs text-muted-foreground">{t('accountSettingsPage.deleteAccountDesc')}</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-500 border-red-500/30 hover:bg-red-500/5"
            >
              {t('accountSettingsPage.deleteMyAccount')}
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-red-500/5 rounded-xl border border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-500">{t('accountSettingsPage.cannotBeUndone')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('accountSettingsPage.deleteWarning')}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('accountSettingsPage.typeDeleteToConfirm')) }} />
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 bg-background border border-red-500/30 rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deleting ? <Spinner size="sm" className="mr-2" /> : null}
                  {deleting ? t('accountSettingsPage.deleting') : t('accountSettingsPage.deleteForever')}
                </Button>
                <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>
                  {t('accountSettingsPage.cancel')}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default AccountSettingsPage;
