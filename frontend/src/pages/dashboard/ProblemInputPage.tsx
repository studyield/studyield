import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useProblemSolverStore } from '@/stores/useProblemSolverStore';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  Camera,
  Mic,
  Upload,
  Sparkles,
  X,
  Image as ImageIcon,
  FileText,
  History,
  ChevronDown,
  Zap,
  Brain,
  CheckCircle,
  Bookmark,
  Layers,
} from 'lucide-react';

const SUBJECT_KEYS = [
  'autoDetect',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'computerScience',
  'economics',
  'statistics',
  'engineering',
  'other',
] as const;

export function ProblemInputPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createAndSolve, isLoading, error, clearError } = useProblemSolverStore();
  const [problemText, setProblemText] = useState('');
  const [subject, setSubject] = useState('autoDetect');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleImageUpload = useCallback((file: File) => {
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.webm');
          const res = await api.post(ENDPOINTS.content.extractAudio, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const transcribed = res.data?.text?.trim();
          if (transcribed) {
            setProblemText((prev) => (prev ? prev + ' ' + transcribed : transcribed));
          }
        } catch {
          clearError();
          useProblemSolverStore.setState({ error: t('problemInput.transcribeError') });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      clearError();
      useProblemSolverStore.setState({ error: t('problemInput.micDenied') });
    }
  };

  const handleSolve = async () => {
    if (!problemText.trim() && !uploadedImage) return;
    clearError();

    const subjectVal = subject === 'autoDetect' ? undefined : t(`problemInput.subjects.${subject}`);

    // If image uploaded, we'll pass it as imageUrl (in production, upload first)
    const sessionId = await createAndSolve(problemText, subjectVal);
    if (sessionId) {
      navigate(`/dashboard/problem-solver/solve/${sessionId}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-500" />
                </div>
                {t('problemInput.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('problemInput.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/problem-solver/bookmarks')}
              >
                <Bookmark className="w-4 h-4 mr-2" />
                {t('problemInput.saved')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/problem-solver/batch')}
              >
                <Layers className="w-4 h-4 mr-2" />
                {t('problemInput.batch')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/problem-solver/history')}
              >
                <History className="w-4 h-4 mr-2" />
                {t('problemInput.history')}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          {/* Subject Selector */}
          <div className="mb-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {t('problemInput.subjectLabel')}
            </label>
            <div className="relative">
              <button
                onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                className="flex items-center justify-between w-full sm:w-64 px-3 py-2 bg-muted/50 rounded-lg text-sm border border-border hover:border-green-500/50 transition-colors"
              >
                <span>{t(`problemInput.subjects.${subject}`)}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              {showSubjectDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSubjectDropdown(false)}
                  />
                  <div className="absolute top-full mt-1 w-full sm:w-64 bg-card border border-border rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                    {SUBJECT_KEYS.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSubject(s);
                          setShowSubjectDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                          subject === s ? 'text-green-500 font-medium' : ''
                        }`}
                      >
                        {t(`problemInput.subjects.${s}`)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Text Input */}
          <div className="mb-4">
            <textarea
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder={t('problemInput.textPlaceholder')}
              className="w-full h-40 px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Image Upload Area */}
          {imagePreview ? (
            <div className="mb-4 relative inline-block">
              <img
                src={imagePreview}
                alt="Problem"
                className="max-h-48 rounded-xl border border-border"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="mb-4 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-green-500/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('problemInput.dragDrop')}{' '}
                <span className="text-green-500 font-medium">{t('problemInput.clickToUpload')}</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {t('problemInput.fileTypes')}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/dashboard/problem-solver/camera')}
              className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 rounded-xl text-sm font-medium hover:bg-muted transition-colors border border-border"
            >
              <Camera className="w-4 h-4 text-blue-500" />
              {t('problemInput.scan')}
            </button>
            <button
              onClick={handleVoiceInput}
              disabled={isTranscribing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                isRecording
                  ? 'bg-red-500/10 border-red-500/30 text-red-500'
                  : isTranscribing
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 opacity-70'
                    : 'bg-muted/50 border-border hover:bg-muted'
              }`}
            >
              {isTranscribing ? (
                <Spinner size="sm" className="w-4 h-4" />
              ) : (
                <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
              )}
              {isRecording ? t('problemInput.stop') : isTranscribing ? t('problemInput.transcribing') : t('problemInput.voice')}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 rounded-xl text-sm font-medium hover:bg-muted transition-colors border border-border"
            >
              <ImageIcon className="w-4 h-4 text-green-500" />
              {t('problemInput.image')}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Solve Button */}
          <Button
            onClick={handleSolve}
            disabled={isLoading || (!problemText.trim() && !uploadedImage)}
            className="w-full h-12 text-base font-semibold"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t('problemInput.creatingSession')}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {t('problemInput.solveProblem')}
              </>
            )}
          </Button>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t('problemInput.howItWorks')}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: FileText,
                color: 'blue',
                title: t('problemInput.analysisAgent'),
                desc: t('problemInput.analysisAgentDesc'),
              },
              {
                icon: Zap,
                color: 'amber',
                title: t('problemInput.solverAgent'),
                desc: t('problemInput.solverAgentDesc'),
              },
              {
                icon: CheckCircle,
                color: 'green',
                title: t('problemInput.verifierAgent'),
                desc: t('problemInput.verifierAgentDesc'),
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <div className={`w-9 h-9 rounded-lg bg-${item.color}-500/10 flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-4 h-4 text-${item.color}-500`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default ProblemInputPage;
