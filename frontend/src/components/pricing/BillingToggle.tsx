import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { type BillingCycle } from '@/config/pricing';

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  className?: string;
}

const cycles: BillingCycle[] = ['monthly', 'yearly'];

export function BillingToggle({ value, onChange, className }: BillingToggleProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('inline-flex items-center bg-muted p-1 rounded-lg', className)}>
      {cycles.map((cycle) => (
        <button
          key={cycle}
          onClick={() => onChange(cycle)}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
            value === cycle
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t(`pricing.billingToggle.${cycle}`)}
        </button>
      ))}
    </div>
  );
}
