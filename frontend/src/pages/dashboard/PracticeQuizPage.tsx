import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizQuestion } from '@/services/problemSolver';
import { problemSolverService } from '@/services/problemSolver';
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw, Zap } from 'lucide-react';

export function PracticeQuizPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string; explanation: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const existing = await problemSolverService.getQuizQuestions(id!);
      if (existing.length > 0) {
        setQuestions(existing);
        const answered = existing.filter(q => q.userAnswer !== null);
        setScore({ correct: answered.filter(q => q.isCorrect).length, total: answered.length });
        if (answered.length === existing.length) setFinished(true);
        else setCurrentIdx(answered.length);
      }
    } catch {}
    setLoading(false);
  };

  const generateQuiz = async () => {
    setGenerating(true);
    try {
      const qs = await problemSolverService.generatePracticeQuiz(id!, 5);
      setQuestions(qs);
      setCurrentIdx(0);
      setScore({ correct: 0, total: 0 });
      setFinished(false);
    } catch {}
    setGenerating(false);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !questions[currentIdx]) return;
    setSubmitting(true);
    try {
      const res = await problemSolverService.submitQuizAnswer(questions[currentIdx].id, selectedAnswer);
      setResult(res);
      setScore(prev => ({
        correct: prev.correct + (res.isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    } catch {}
    setSubmitting(false);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setResult(null);
    }
  };

  const q = questions[currentIdx];
  const diffColor = (d: string) => d === 'easy' ? 'text-green-500 bg-green-500/10' : d === 'hard' ? 'text-red-500 bg-red-500/10' : 'text-amber-500 bg-amber-500/10';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/dashboard/problem-solver/solution/${id}`)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> {t('practiceQuiz.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('practiceQuiz.subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : questions.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center">
            <Zap className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t('practiceQuiz.generateTitle')}</h2>
            <p className="text-muted-foreground mb-6">{t('practiceQuiz.generateDescription')}</p>
            <Button onClick={generateQuiz} disabled={generating}>
              {generating ? <><Spinner size="sm" className="mr-2" />{t('practiceQuiz.generating')}</> : t('practiceQuiz.generateButton')}
            </Button>
          </div>
        ) : finished ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border p-8 text-center">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('practiceQuiz.quizComplete')}</h2>
            <p className="text-4xl font-bold text-green-500 mb-2">{score.correct}/{score.total}</p>
            <p className="text-muted-foreground mb-6">
              {score.correct === score.total ? t('practiceQuiz.perfectScore') : score.correct >= score.total * 0.7 ? t('practiceQuiz.greatJob') : t('practiceQuiz.keepPracticing')}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(`/dashboard/problem-solver/solution/${id}`)}>
                {t('practiceQuiz.backToSolution')}
              </Button>
              <Button onClick={() => { setQuestions([]); generateQuiz(); }}>
                <RotateCcw className="w-4 h-4 mr-2" /> {t('practiceQuiz.newQuiz')}
              </Button>
            </div>
          </motion.div>
        ) : q ? (
          <div>
            {/* Progress */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${((currentIdx + (result ? 1 : 0)) / questions.length) * 100}%` }} />
              </div>
              <span className="text-sm font-medium">{currentIdx + 1}/{questions.length}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor(q.difficulty)}`}>{q.difficulty}</span>
            </div>

            <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl border p-6">
              <p className="text-lg font-medium mb-6">{q.question}</p>

              <div className="space-y-3 mb-6">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => !result && setSelectedAnswer(opt)}
                    disabled={!!result}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      result
                        ? opt === result.correctAnswer
                          ? 'border-green-500 bg-green-500/10'
                          : opt === selectedAnswer && !result.isCorrect
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-border opacity-50'
                        : selectedAnswer === opt
                          ? 'border-green-500 bg-green-500/5'
                          : 'border-border hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm">{opt}</span>
                      {result && opt === result.correctAnswer && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                      {result && opt === selectedAnswer && !result.isCorrect && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>

              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl mb-4 ${result.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <p className="text-sm font-medium mb-1">{result.isCorrect ? t('practiceQuiz.correctResult') : t('practiceQuiz.incorrectResult')}</p>
                  <p className="text-sm text-muted-foreground">{result.explanation}</p>
                </motion.div>
              )}

              {!result ? (
                <Button onClick={submitAnswer} disabled={!selectedAnswer || submitting} className="w-full">
                  {submitting ? <><Spinner size="sm" className="mr-2" />{t('practiceQuiz.checking')}</> : t('practiceQuiz.submitAnswer')}
                </Button>
              ) : (
                <Button onClick={nextQuestion} className="w-full">
                  {currentIdx + 1 >= questions.length ? t('practiceQuiz.seeResults') : t('practiceQuiz.nextQuestion')}
                </Button>
              )}
            </motion.div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default PracticeQuizPage;
