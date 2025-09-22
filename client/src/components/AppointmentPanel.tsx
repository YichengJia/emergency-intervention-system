import React from 'react';
import { client } from '@/fhir/client';
import { dayBoundsISO, formatLocalTime } from '@/utils/tz';

type Props = {
  practitionerId: string;
  title?: string;
};

export default function AppointmentsPanel({ practitionerId, title = 'Appointments (today)' }: Props) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startISO, endISO } = dayBoundsISO();
      // actor=Practitioner/{id}; restrict to today's window using ge/lt
      const q =
        `Appointment?actor=${encodeURIComponent(`Practitioner/${practitionerId}`)}` +
        `&date=ge${encodeURIComponent(startISO)}` +
        `&date=lt${encodeURIComponent(endISO)}` +
        '&_sort=date&_count=50';
      const bundle = await client.request(q, { method: 'GET' });
      const entries = bundle?.entry?.map((e: any) => e.resource) ?? [];
      setItems(entries);
    } catch (err: any) {
      setError(err?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [practitionerId]);

  React.useEffect(() => {
    if (!practitionerId) return;
    load();
    const id = window.setInterval(load, 5000); // light polling
    return () => window.clearInterval(id);
  }, [practitionerId, load]);

  if (loading && items.length === 0) return <div className="text-sm text-gray-500">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (items.length === 0) return <div className="text-sm text-gray-500">No appointments.</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id} className="rounded border p-3 text-sm">
            <div className="font-medium">
              {formatLocalTime(a.start)} – {formatLocalTime(a.end)} · {a.status ?? 'unknown'}
            </div>
            <div className="text-gray-600">
              {(a.participant || [])
                .map((p: any) => p.actor?.reference)
                .filter(Boolean)
                .join(', ')}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
