import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { extractClozeBlanks } from '@/types';
import { Brackets } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ClozeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ClozeEditor({ value, onChange, placeholder }: ClozeEditorProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blanks = extractClozeBlanks(value);

  const insertBlank = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);
    const insertion = selectedText ? `{{${selectedText}}}` : '{{}}';
    const newValue = value.slice(0, start) + insertion + value.slice(end);
    onChange(newValue);
    // Set cursor position inside the braces if no selection
    setTimeout(() => {
      const cursorPos = selectedText ? start + insertion.length : start + 2;
      textarea.setSelectionRange(cursorPos, cursorPos);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={insertBlank}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
        >
          <Brackets className="w-3.5 h-3.5" />
          {t('clozeEditor.insertBlank')}
        </button>
        <span className="text-[10px] text-muted-foreground">
          {t('clozeEditor.wrapHint', { braces: '{{...}}' })}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('clozeEditor.placeholder')}
        rows={4}
        className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-y font-mono"
        style={{ minHeight: '80px' }}
        onInput={(e) => {
          const t = e.target as HTMLTextAreaElement;
          t.style.height = 'auto';
          t.style.height = Math.max(80, t.scrollHeight) + 'px';
        }}
      />

      {/* Live preview */}
      {blanks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-muted/30 border border-border/50 rounded-lg"
        >
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('clozeEditor.preview')} ({blanks.length !== 1 ? t('clozeEditor.blanksCountPlural', { count: blanks.length }) : t('clozeEditor.blanksCount', { count: blanks.length })})
          </p>
          <p className="text-sm leading-relaxed">
            {value.split(/(\{\{.+?\}\})/g).map((part, i) => {
              if (part.startsWith('{{') && part.endsWith('}}')) {
                return (
                  <span
                    key={i}
                    className="inline-block px-2 py-0.5 mx-0.5 bg-green-500/10 border border-green-500/30 rounded text-green-600 dark:text-green-400 font-medium"
                  >
                    {part.slice(2, -2)}
                  </span>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </p>
        </motion.div>
      )}
    </div>
  );
}
