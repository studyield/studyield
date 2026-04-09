import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import { problemSolverService } from '@/services/problemSolver';
import { useProblemSolverStore } from '@/stores/useProblemSolverStore';
import { ArrowLeft, FileText, Upload, Play, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';

export function BatchSolverPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createAndSolve } = useProblemSolverStore();
  const [text, setText] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [solvingIdx, setSolvingIdx] = useState<number | null>(null);
  const [solvedIds, setSolvedIds] = useState<Record<number, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(ENDPOINTS.content.extract, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const content = res.data.text || res.data.content || '';
      setText(content);
      setProblems(await problemSolverService.batchExtractProblems(content));
    } catch {
      // Silently ignore extraction errors
    }
    setExtracting(false);
  };

  const extractFromText = async () => {
    if (!text.trim()) return;
    setExtracting(true);
    try { setProblems(await problemSolverService.batchExtractProblems(text)); } catch {
      // Silently ignore extraction errors
    }
    setExtracting(false);
  };

  const solveProblem = async (idx: number) => {
    setSolvingIdx(idx);
    try {
      const sessionId = await createAndSolve(problems[idx]);
      if (sessionId) setSolvedIds(prev => ({ ...prev, [idx]: sessionId }));
    } catch {
      // Silently ignore solve errors
    }
    setSolvingIdx(null);
  };

  const solveAll = async () => {
    for (let i = 0; i < problems.length; i++) {
      if (!solvedIds[i]) await solveProblem(i);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard/problem-solver')} className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" /> {t('batchSolver.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('batchSolver.subtitle')}</p>
          </div>
        </div>

        {problems.length === 0 ? (
          <div className="space-y-4">
            <div onClick={() => fileRef.current?.click()} className="bg-card rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer hover:border-green-500/50 transition-colors">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">{t('batchSolver.uploadPdfImage')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('batchSolver.dropWorksheet')}</p>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={handlePdfUpload} className="hidden" />
            <div className="text-center text-sm text-muted-foreground">{t('batchSolver.orPasteText')}</div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('batchSolver.pastePlaceholder')} className="w-full h-48 px-4 py-3 bg-card border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50" />
            <Button onClick={extractFromText} disabled={!text.trim() || extracting} className="w-full">
              {extracting ? <><Spinner size="sm" className="mr-2" />{t('batchSolver.extractingProblems')}</> : t('batchSolver.extractProblems')}
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">{t('batchSolver.problemsFound', { count: problems.length })}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setProblems([])}>{t('batchSolver.clear')}</Button>
                <Button size="sm" onClick={solveAll} disabled={solvingIdx !== null}><Play className="w-4 h-4 mr-1" /> {t('batchSolver.solveAll')}</Button>
              </div>
            </div>
            <div className="space-y-3">
              {problems.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-card rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                        {solvedIds[i] && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {solvingIdx === i && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                      </div>
                      <p className="text-sm">{p}</p>
                    </div>
                    {solvedIds[i] ? (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/problem-solver/solution/${solvedIds[i]}`)}>{t('batchSolver.view')}</Button>
                    ) : (
                      <Button size="sm" onClick={() => solveProblem(i)} disabled={solvingIdx !== null}>{t('batchSolver.solve')}</Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default BatchSolverPage;
