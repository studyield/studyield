import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { COMPARISON_FEATURES } from '@/config/pricing';

export function ComparisonTable() {
  const { t } = useTranslation();

  const renderCell = (value: string | boolean) => {
    if (value === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />;
    if (value === false) return <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
    const translationMap: Record<string, string> = {
      unlimited: t('pricing.comparison.unlimited'),
      basic: t('pricing.comparison.basic'),
      allPlusLive: t('pricing.comparison.allPlusLive'),
    };
    const display = translationMap[value] ?? value;
    return <span className="text-sm">{display}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto overflow-x-auto"
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
              {t('pricing.comparison.feature')}
            </th>
            <th className="text-center py-4 px-4 text-sm font-medium">
              {t('pricing.plans.free.name')}
            </th>
            <th className="text-center py-4 px-4 text-sm font-medium text-green-500">
              {t('pricing.plans.pro.name')}
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_FEATURES.map((row) => (
            <tr
              key={row.key}
              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 px-4 text-sm">
                {t(`pricing.comparison.${row.key}`)}
              </td>
              <td className="py-3 px-4 text-center">{renderCell(row.free)}</td>
              <td className="py-3 px-4 text-center bg-green-500/5">
                {renderCell(row.pro)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
