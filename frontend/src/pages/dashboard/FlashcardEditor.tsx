import { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import { ImportSection } from './ImportSection';
import { ClozeEditor } from '@/components/ClozeEditor';
import { ImageOcclusionEditor } from '@/components/ImageOcclusionEditor';
import type { FlashcardType, OcclusionRegion } from '@/types';
import {
  Plus,
  PenLine,
  Sparkles,
  Upload,
  Trash2,
  Loader2,
  Check,
  Wand2,
  Lightbulb,
  MessageSquare,
  BookOpen,
  Brain,
  Minimize2,
  GripVertical,
  CheckSquare,
  Square,
  Type,
  Brackets,
  ImageIcon,
} from 'lucide-react';

// ─── Types (exported so parents can use if needed) ──────────────────
export interface DraftCard {
  id: string;
  front: string;
  back: string;
  type: FlashcardType;
  source: 'manual' | 'ai' | 'import';
  selected: boolean;
  // Image occlusion specific
  imageUrl?: string;
  regions?: OcclusionRegion[];
}

export interface FlashcardEditorRef {
  getValidCards(): Array<{ front: string; back: string; type?: FlashcardType }>;
  getCardCounts(): { total: number; valid: number };
  reset(): void;
}

export interface FlashcardEditorProps {
  onCountChange?: (total: number, valid: number) => void;
  studySetId?: string;
}

// ─── Internal helpers ───────────────────────────────────────────────
let _nextId = 1;
function uid() {
  return `dc-${_nextId++}-${Date.now()}`;
}

type Tab = 'manual' | 'ai' | 'import';

const COUNT_PRESETS = [5, 10, 15, 20, 30, 50];

// ═════════════════════════════════════════════════════════════════════
export const FlashcardEditor = forwardRef<FlashcardEditorRef, FlashcardEditorProps>(
  function FlashcardEditor({ onCountChange, studySetId }, ref) {
    const { t } = useTranslation();

    const TABS: { key: Tab; label: string; icon: typeof PenLine }[] = [
      { key: 'manual', label: t('flashcardEditor.manual'), icon: PenLine },
      { key: 'ai', label: t('flashcardEditor.aiGenerate'), icon: Sparkles },
      { key: 'import', label: t('flashcardEditor.importTab'), icon: Upload },
    ];

    const ASSIST_ACTIONS = [
      { key: 'suggest_answer' as const, label: t('flashcardEditor.suggestAnswer'), icon: MessageSquare, desc: t('flashcardEditor.suggestAnswerDesc') },
      { key: 'elaborate' as const, label: t('flashcardEditor.elaborate'), icon: BookOpen, desc: t('flashcardEditor.elaborateDesc') },
      { key: 'mnemonic' as const, label: t('flashcardEditor.addMnemonic'), icon: Brain, desc: t('flashcardEditor.addMnemonicDesc') },
      { key: 'simplify' as const, label: t('flashcardEditor.simplify'), icon: Minimize2, desc: t('flashcardEditor.simplifyDesc') },
    ];

    // ── Card list state ────────────────────────────────────────────
    const [cards, setCards] = useState<DraftCard[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('manual');

    // ── AI Generate state ──────────────────────────────────────────
    const [aiContent, setAiContent] = useState('');
    const [aiCount, setAiCount] = useState(10);
    const [aiCardType, setAiCardType] = useState<'qa' | 'fill_blank' | 'true_false'>('qa');
    const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [isGenerating, setIsGenerating] = useState(false);
    const [genError, setGenError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);

    // ── AI Assist (per-card) state ─────────────────────────────────
    const [sparkleId, setSparkleId] = useState<string | null>(null);
    const [assistCardId, setAssistCardId] = useState<string | null>(null);
    const [assistSuggestion, setAssistSuggestion] = useState<string | null>(null);
    const [assistLoading, setAssistLoading] = useState(false);

    // ── Adjust cards state ─────────────────────────────────────────
    const [adjustInstr, setAdjustInstr] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);

    // ── Derived ────────────────────────────────────────────────────
    const validCards = cards.filter((c) => c.front.trim() && c.back.trim());
    const selectedCount = cards.filter((c) => c.selected).length;
    const allSelected = cards.length > 0 && selectedCount === cards.length;

    // ── Notify parent of count changes ─────────────────────────────
    useEffect(() => {
      onCountChange?.(cards.length, validCards.length);
    }, [cards.length, validCards.length, onCountChange]);

    // ── Imperative ref API ─────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      getValidCards() {
        return cards
          .filter((c) => {
            if (c.type === 'image_occlusion') {
              return c.imageUrl && c.regions && c.regions.length > 0;
            }
            if (c.type === 'cloze') {
              return c.front.trim().includes('{{') && c.front.trim().includes('}}');
            }
            return c.front.trim() && c.back.trim();
          })
          .map((c) => {
            if (c.type === 'image_occlusion') {
              return {
                front: JSON.stringify({ imageUrl: c.imageUrl, regions: c.regions }),
                back: c.back.trim() || 'Image Occlusion Card',
                type: c.type,
              };
            }
            return { front: c.front.trim(), back: c.back.trim(), type: c.type };
          });
      },
      getCardCounts() {
        return { total: cards.length, valid: validCards.length };
      },
      reset() {
        setCards([]);
        setHasGenerated(false);
        setAssistCardId(null);
        setAssistSuggestion(null);
        setSparkleId(null);
      },
    }));

    // ── Card CRUD ──────────────────────────────────────────────────
    const addEmptyCard = useCallback(() => {
      setCards((prev) => [...prev, { id: uid(), front: '', back: '', type: 'standard' as FlashcardType, source: 'manual', selected: false }]);
    }, []);

    const updateCard = useCallback((id: string, field: 'front' | 'back', value: string) => {
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    }, []);

    const deleteCard = useCallback((id: string) => {
      setCards((prev) => prev.filter((c) => c.id !== id));
      if (assistCardId === id) {
        setAssistCardId(null);
        setAssistSuggestion(null);
      }
    }, [assistCardId]);

    const toggleSelect = useCallback((id: string) => {
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));
    }, []);

    const toggleAll = useCallback(() => {
      setCards((prev) => {
        const newVal = !allSelected;
        return prev.map((c) => ({ ...c, selected: newVal }));
      });
    }, [allSelected]);

    const deleteSelected = useCallback(() => {
      setCards((prev) => prev.filter((c) => !c.selected));
      setAssistCardId(null);
      setAssistSuggestion(null);
    }, []);

    // ── Import callback ────────────────────────────────────────────
    const handleImportCards = useCallback((importedCards: Array<{ front: string; back: string }>) => {
      const newCards: DraftCard[] = importedCards.map((c) => ({
        id: uid(),
        front: c.front,
        back: c.back,
        type: 'standard' as FlashcardType,
        source: 'import' as const,
        selected: false,
      }));
      setCards((prev) => [...prev, ...newCards]);
    }, []);

    // ── AI Generate ────────────────────────────────────────────────
    const handleAIGenerate = async () => {
      if (aiContent.trim().length < 50) return;
      setIsGenerating(true);
      setGenError(null);
      try {
        let content = aiContent;
        if (aiCardType === 'fill_blank') content += '\n\n[Instruction: Generate fill-in-the-blank flashcards where the front has a sentence with a blank and the back has the missing word/phrase.]';
        if (aiCardType === 'true_false') content += '\n\n[Instruction: Generate true/false flashcards where the front is a statement and the back is "True" or "False" with a brief explanation.]';
        if (aiDifficulty === 'easy') content += '\n\n[Instruction: Keep questions simple, suitable for beginners.]';
        if (aiDifficulty === 'hard') content += '\n\n[Instruction: Make questions challenging, requiring deep understanding.]';

        const res = await api.post(ENDPOINTS.ai.generateFlashcards, { content, count: aiCount });
        const generated: DraftCard[] = res.data.flashcards.map((c: { front: string; back: string }) => ({
          id: uid(), front: c.front, back: c.back, type: 'standard' as FlashcardType, source: 'ai' as const, selected: false,
        }));
        setCards((prev) => [...prev, ...generated]);
        setHasGenerated(true);
      } catch {
        setGenError(t('flashcardEditor.failedGenerate'));
      } finally {
        setIsGenerating(false);
      }
    };

    // ── AI Assist (per-card sparkle) ───────────────────────────────
    const handleAssist = async (cardId: string, front: string, back: string, action: string) => {
      setSparkleId(null);
      setAssistCardId(cardId);
      setAssistSuggestion(null);
      setAssistLoading(true);
      try {
        const res = await api.post(ENDPOINTS.ai.assistCard, { front, back: back || undefined, action });
        setAssistSuggestion(res.data.suggestion);
      } catch {
        setAssistSuggestion(null);
      } finally {
        setAssistLoading(false);
      }
    };

    const acceptSuggestion = (cardId: string, suggestion: string) => {
      updateCard(cardId, 'back', suggestion);
      setAssistCardId(null);
      setAssistSuggestion(null);
    };

    // ── Adjust cards ───────────────────────────────────────────────
    const handleAdjust = async () => {
      if (!adjustInstr.trim() || cards.length === 0) return;
      setIsAdjusting(true);
      try {
        const res = await api.post(ENDPOINTS.ai.adjustCards, {
          flashcards: cards.map((c) => ({ front: c.front, back: c.back })),
          instruction: adjustInstr.trim(),
        });
        const adjusted: DraftCard[] = res.data.flashcards.map((c: { front: string; back: string }, i: number) => ({
          id: cards[i]?.id || uid(),
          front: c.front,
          back: c.back,
          source: cards[i]?.source || ('ai' as const),
          selected: cards[i]?.selected || false,
        }));
        setCards(adjusted);
        setAdjustInstr('');
      } catch {
        // silent
      } finally {
        setIsAdjusting(false);
      }
    };

    // ═══════════ RENDER ═══════════════════════════════════════════
    return (
      <div className="space-y-6">
        {/* ═══════════ Tabs Section ═══════════ */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-500/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {/* ── Manual tab ── */}
            {activeTab === 'manual' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/10 rounded-lg"
              >
                <Lightbulb className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">{t('flashcardEditor.tipsTitle')}</p>
                  <ul className="space-y-0.5 list-disc list-inside text-xs">
                    <li>{t('flashcardEditor.tip1')}</li>
                    <li>{t('flashcardEditor.tip2')}</li>
                    <li>
                      {t('flashcardEditor.tip3').split('<tab/>').map((part, i, arr) =>
                        i < arr.length - 1 ? <span key={i}>{part}<kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Tab</kbd></span> : part
                      )}
                    </li>
                    <li>
                      {t('flashcardEditor.tip4').split('<enter/>').map((part, i, arr) =>
                        i < arr.length - 1 ? <span key={i}>{part}<kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd></span> : part
                      )}
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* ── AI Generate tab ── */}
            {activeTab === 'ai' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('flashcardEditor.pasteNotes')}</label>
                  <textarea
                    value={aiContent}
                    onChange={(e) => setAiContent(e.target.value)}
                    placeholder={t('flashcardEditor.pastePlaceholder')}
                    rows={6}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {aiContent.length < 50 ? t('flashcardEditor.charsNeeded', { count: 50 - aiContent.length }) : t('flashcardEditor.chars', { count: aiContent.length })}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">{t('flashcardEditor.numberOfCards')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {COUNT_PRESETS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAiCount(n)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${aiCount === n ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400' : 'border-border hover:border-green-500/50'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">{t('flashcardEditor.cardType')}</label>
                    <select value={aiCardType} onChange={(e) => setAiCardType(e.target.value as typeof aiCardType)} className="w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20">
                      <option value="qa">{t('flashcardEditor.qa')}</option>
                      <option value="fill_blank">{t('flashcardEditor.fillBlank')}</option>
                      <option value="true_false">{t('flashcardEditor.trueFalse')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">{t('flashcardEditor.difficulty')}</label>
                    <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as typeof aiDifficulty)} className="w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20">
                      <option value="easy">{t('flashcardEditor.easy')}</option>
                      <option value="medium">{t('flashcardEditor.medium')}</option>
                      <option value="hard">{t('flashcardEditor.hard')}</option>
                    </select>
                  </div>
                </div>

                {genError && (
                  <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{genError}</div>
                )}

                <Button type="button" onClick={handleAIGenerate} disabled={aiContent.trim().length < 50 || isGenerating} className="w-full bg-green-500 hover:bg-green-600">
                  {isGenerating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('flashcardEditor.generatingCards', { count: aiCount })}</>) : (<><Sparkles className="w-4 h-4 mr-2" />{t('flashcardEditor.generateCards', { count: aiCount })}</>)}
                </Button>
              </motion.div>
            )}

            {/* ── Import tab ── */}
            {activeTab === 'import' && (
              <ImportSection onCardsImported={handleImportCards} studySetId={studySetId} />
            )}
          </div>
        </div>

        {/* ═══════════ Card List ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t('flashcardEditor.cards')}{' '}
              <span className="text-muted-foreground font-normal">
                ({cards.length}{validCards.length !== cards.length ? ` ${t('flashcardEditor.validCount', { count: validCards.length })}` : ''})
              </span>
            </h3>
            {cards.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                >
                  {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {allSelected ? t('flashcardEditor.deselectAll') : t('flashcardEditor.selectAll')}
                </button>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('flashcardEditor.deleteCount', { count: selectedCount })}
                  </button>
                )}
              </div>
            )}
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
              <GripVertical className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium mb-1">{t('flashcardEditor.noCardsYet')}</p>
              <p className="text-xs">
                {activeTab === 'manual' && t('flashcardEditor.noCardsManual')}
                {activeTab === 'ai' && t('flashcardEditor.noCardsAi')}
                {activeTab === 'import' && t('flashcardEditor.noCardsImport')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {cards.map((card, idx) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <div className={`p-4 bg-card border rounded-xl transition-all ${card.selected ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-green-500/20'}`}>
                      {/* Card header */}
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => toggleSelect(card.id)}
                          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {card.selected ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4" />}
                        </button>
                        <span className="text-xs text-muted-foreground font-mono font-medium">{idx + 1}</span>
                        {card.source !== 'manual' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${card.source === 'ai' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {card.source === 'ai' ? t('flashcardEditor.ai') : t('flashcardEditor.imported')}
                          </span>
                        )}
                        <div className="flex-1" />
                        {/* AI Assist sparkle */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setSparkleId(sparkleId === card.id ? null : card.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 transition-colors"
                            title={t('flashcardEditor.aiAssist')}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          {sparkleId === card.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-60 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                              <div className="px-3 py-2.5 border-b border-border bg-purple-500/5">
                                <div className="flex items-center gap-2 text-sm font-medium text-purple-500">
                                  <Sparkles className="w-4 h-4" />{t('flashcardEditor.aiAssist')}
                                </div>
                              </div>
                              <div className="py-1">
                                {ASSIST_ACTIONS.map((a) => (
                                  <button
                                    key={a.key}
                                    type="button"
                                    onClick={() => handleAssist(card.id, card.front, card.back, a.key)}
                                    disabled={!card.front.trim() || card.front.trim().length < 10}
                                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <a.icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm font-medium">{a.label}</div>
                                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCard(card.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Card type toggle */}
                      <div className="flex items-center gap-1 mb-3">
                        {([
                          { key: 'standard' as FlashcardType, label: t('flashcardEditor.standard'), icon: Type },
                          { key: 'cloze' as FlashcardType, label: t('flashcardEditor.cloze'), icon: Brackets },
                          { key: 'image_occlusion' as FlashcardType, label: t('flashcardEditor.image'), icon: ImageIcon },
                        ]).map((tp) => (
                          <button
                            key={tp.key}
                            type="button"
                            onClick={() => setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, type: tp.key } : c))}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                              card.type === tp.key
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <tp.icon className="w-3 h-3" />
                            {tp.label}
                          </button>
                        ))}
                      </div>

                      {/* Card content based on type */}
                      {card.type === 'cloze' ? (
                        <ClozeEditor
                          value={card.front}
                          onChange={(val) => updateCard(card.id, 'front', val)}
                        />
                      ) : card.type === 'image_occlusion' ? (
                        <ImageOcclusionEditor
                          imageUrl={card.imageUrl || ''}
                          regions={card.regions || []}
                          onRegionsChange={(regions) => setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, regions } : c))}
                          onImageChange={(url) => setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, imageUrl: url } : c))}
                        />
                      ) : (
                        /* Standard Term & Definition */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">{t('flashcardEditor.term')}</label>
                            <textarea
                              value={card.front}
                              onChange={(e) => updateCard(card.id, 'front', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Tab' && !e.shiftKey) {
                                  e.preventDefault();
                                  const parent = e.currentTarget.closest('.grid');
                                  const next = parent?.querySelectorAll('textarea')[1];
                                  (next as HTMLTextAreaElement)?.focus();
                                }
                              }}
                              placeholder={t('flashcardEditor.termPlaceholder')}
                              rows={2}
                              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none overflow-hidden"
                              style={{ minHeight: '60px' }}
                              onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = Math.max(60, target.scrollHeight) + 'px'; }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">{t('flashcardEditor.definition')}</label>
                            <textarea
                              value={card.back}
                              onChange={(e) => updateCard(card.id, 'back', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && idx === cards.length - 1) {
                                  e.preventDefault();
                                  addEmptyCard();
                                }
                              }}
                              placeholder={t('flashcardEditor.definitionPlaceholder')}
                              rows={2}
                              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none overflow-hidden"
                              style={{ minHeight: '60px' }}
                              onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = Math.max(60, target.scrollHeight) + 'px'; }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Suggestion inline */}
                    {assistCardId === card.id && assistLoading && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-1 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg ml-6"
                      >
                        <div className="flex items-center gap-2 text-sm text-purple-500">
                          <Sparkles className="w-4 h-4 animate-pulse" />{t('flashcardEditor.generatingSuggestion')}
                        </div>
                      </motion.div>
                    )}
                    {assistCardId === card.id && assistSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-1 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg ml-6"
                      >
                        <p className="text-sm mb-2.5">{assistSuggestion}</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => acceptSuggestion(card.id, assistSuggestion)} className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1">
                            <Check className="w-3 h-3" />{t('flashcardEditor.accept')}
                          </button>
                          <button type="button" onClick={() => { setAssistCardId(null); setAssistSuggestion(null); }} className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors">
                            {t('flashcardEditor.dismiss')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Add card button */}
          <button
            type="button"
            onClick={addEmptyCard}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-green-500 hover:border-green-500/30 hover:bg-green-500/5 transition-all"
          >
            <Plus className="w-4 h-4" />{t('flashcardEditor.addCard')}
          </button>
        </div>

        {/* ═══════════ Adjust Cards Bar ═══════════ */}
        {hasGenerated && cards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                value={adjustInstr}
                onChange={(e) => setAdjustInstr(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdjust(); } }}
                placeholder={t('flashcardEditor.adjustPlaceholder')}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <Button type="button" onClick={handleAdjust} disabled={!adjustInstr.trim() || isAdjusting} variant="outline" className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10">
              {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span className="ml-1.5">{t('flashcardEditor.adjust')}</span>
            </Button>
          </motion.div>
        )}
      </div>
    );
  }
);
