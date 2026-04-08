import { useAuth } from '@/contexts/AuthContext';

const PRO_FEATURES = new Set([
  'problem_solver',
  'batch_solver',
  'exam_clone',
  'knowledge_base',
  'teach_back',
  'learning_paths',
  'deep_research',
  'live_quiz',
  'advanced_analytics',
  'concept_maps',
  'formula_cards',
]);

export function usePlanGate() {
  const { user } = useAuth();
  const plan = user?.plan || 'free';
  const isPro = plan !== 'free';

  const canAccess = (feature: string): boolean => {
    if (isPro) return true;
    return !PRO_FEATURES.has(feature);
  };

  return { isPro, plan, canAccess };
}
