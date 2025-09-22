import React from 'react';
import { formatLocalTime, isSameLocalDay } from '@/utils/tz';

type CalendarItem = {
  when: string; // ISO string
  text: string; // e.g., "Vitamin B 12 5 MG/ML Injectable Solution"
  taken?: boolean; // true=taken, false=missed, undefined=unknown
};

type Props = {
  items: CalendarItem[];
  title?: string;
};

export default function MedicationCalendar({ items, title = 'Medication Calendar (Today)' }: Props) {
  // Filter items to "today" in the user's local timezone.
  const itemsToday = React.useMemo(
    () => items.filter((x) => isSameLocalDay(x.when)),
    [items]
  );

  // Stable sort by local wall-clock time by comparing underlying timestamps.
  const sorted = React.useMemo(
    () => [...itemsToday].sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime()),
    [itemsToday]
  );

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {sorted.length === 0 ? (
        <div className="text-sm text-gray-500">No medication scheduled today.</div>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border">
          {sorted.map((item, idx) => (
            <li key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <time className="text-sm font-medium">{formatLocalTime(item.when)}</time>
                <span className="text-sm">{item.text}</span>
              </div>
              <div className="text-sm">
                {item.taken === true ? (
                  <span className="text-green-600">✓ Recorded as taken.</span>
                ) : item.taken === false ? (
                  <span className="text-red-600">✗ Recorded as missed.</span>
                ) : (
                  <span className="text-gray-500">No record.</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
