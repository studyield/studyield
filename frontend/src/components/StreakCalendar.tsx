import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StreakCalendarProps {
  activeDays: Set<string>; // ISO date strings, e.g. '2025-01-15'
}

export function StreakCalendar({ activeDays }: StreakCalendarProps) {
  const { t } = useTranslation();

  const DAY_NAMES = [
    t('streakCalendar.days.sun'), t('streakCalendar.days.mon'), t('streakCalendar.days.tue'),
    t('streakCalendar.days.wed'), t('streakCalendar.days.thu'), t('streakCalendar.days.fri'),
    t('streakCalendar.days.sat'),
  ];
  const MONTH_NAMES = [
    t('streakCalendar.months.january'), t('streakCalendar.months.february'), t('streakCalendar.months.march'),
    t('streakCalendar.months.april'), t('streakCalendar.months.may'), t('streakCalendar.months.june'),
    t('streakCalendar.months.july'), t('streakCalendar.months.august'), t('streakCalendar.months.september'),
    t('streakCalendar.months.october'), t('streakCalendar.months.november'), t('streakCalendar.months.december'),
  ];
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { days, firstDayOffset } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return { days: daysList, firstDayOffset: firstDay };
  }, [year, month]);

  const goBack = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const goForward = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const todayStr = today.toISOString().split('T')[0];

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h4 className="text-sm font-semibold">
          {MONTH_NAMES[month]} {year}
        </h4>
        <button onClick={goForward} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isActive = activeDays.has(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <div
              key={day}
              className={`relative flex items-center justify-center h-9 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400 font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50'
              } ${isToday ? 'ring-2 ring-green-500/40' : ''}`}
            >
              {day}
              {isActive && (
                <Flame className="absolute -top-1 -right-0.5 w-3 h-3 text-orange-500 fill-orange-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
