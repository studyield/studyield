import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface StudyHeatmapProps {
  data: Record<string, number>; // { '2025-01-15': 5, ... }
  weeks?: number;
}

function getIntensity(count: number, max: number): string {
  if (count === 0) return 'bg-muted';
  const ratio = count / Math.max(max, 1);
  if (ratio <= 0.25) return 'bg-green-200 dark:bg-green-900';
  if (ratio <= 0.5) return 'bg-green-400 dark:bg-green-700';
  if (ratio <= 0.75) return 'bg-green-500 dark:bg-green-600';
  return 'bg-green-600 dark:bg-green-500';
}

export function StudyHeatmap({ data, weeks = 52 }: StudyHeatmapProps) {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const MONTHS = [
    t('studyHeatmap.months.jan'), t('studyHeatmap.months.feb'), t('studyHeatmap.months.mar'),
    t('studyHeatmap.months.apr'), t('studyHeatmap.months.may'), t('studyHeatmap.months.jun'),
    t('studyHeatmap.months.jul'), t('studyHeatmap.months.aug'), t('studyHeatmap.months.sep'),
    t('studyHeatmap.months.oct'), t('studyHeatmap.months.nov'), t('studyHeatmap.months.dec'),
  ];
  const DAYS = [t('studyHeatmap.days.mon'), '', t('studyHeatmap.days.wed'), '', t('studyHeatmap.days.fri'), '', ''];

  const { grid, monthLabels, maxCount } = useMemo(() => {
    const today = new Date();
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);
    // Adjust to start on Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const cells: Array<{ date: string; count: number; week: number; day: number }> = [];
    let maxVal = 0;
    const months: Array<{ label: string; week: number }> = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split('T')[0];
        const count = data[dateStr] || 0;
        if (count > maxVal) maxVal = count;
        cells.push({ date: dateStr, count, week: w, day: d });

        const month = cursor.getMonth();
        if (month !== lastMonth) {
          months.push({ label: MONTHS[month], week: w });
          lastMonth = month;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return { grid: cells, monthLabels: months, maxCount: maxVal };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, weeks, t]);

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex ml-8 mb-1 text-[10px] text-muted-foreground">
        {monthLabels.map((m, i) => (
          <span key={i} style={{ marginLeft: i === 0 ? 0 : `${(m.week - (monthLabels[i - 1]?.week ?? 0)) * 14 - 20}px` }}>
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 text-[10px] text-muted-foreground justify-between py-0.5">
          {DAYS.map((d, i) => (
            <span key={i} className="h-[12px] flex items-center">{d}</span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[2px] overflow-x-auto">
          {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} className="flex flex-col gap-[2px]">
              {Array.from({ length: 7 }).map((_, d) => {
                const cell = grid.find((c) => c.week === w && c.day === d);
                if (!cell) return <div key={d} className="w-[12px] h-[12px]" />;
                return (
                  <div
                    key={d}
                    className={`w-[12px] h-[12px] rounded-[2px] ${getIntensity(cell.count, maxCount)} cursor-default transition-colors`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ date: cell.date, count: cell.count, x: rect.left, y: rect.top - 30 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 ml-8 text-[10px] text-muted-foreground">
        <span>{t('studyHeatmap.less')}</span>
        <div className="w-[12px] h-[12px] rounded-[2px] bg-muted" />
        <div className="w-[12px] h-[12px] rounded-[2px] bg-green-200 dark:bg-green-900" />
        <div className="w-[12px] h-[12px] rounded-[2px] bg-green-400 dark:bg-green-700" />
        <div className="w-[12px] h-[12px] rounded-[2px] bg-green-500 dark:bg-green-600" />
        <div className="w-[12px] h-[12px] rounded-[2px] bg-green-600 dark:bg-green-500" />
        <span>{t('studyHeatmap.more')}</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 bg-popover border border-border rounded-md shadow-lg text-xs pointer-events-none"
          style={{ left: tooltip.x - 20, top: tooltip.y }}
        >
          <span className="font-medium">{t('studyHeatmap.sessions', { count: tooltip.count })}</span>
          <span className="text-muted-foreground"> {t('studyHeatmap.on')} {tooltip.date}</span>
        </div>
      )}
    </div>
  );
}
