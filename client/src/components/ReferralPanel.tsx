import React from 'react';
import { client } from '@/fhir/client';

type Props = {
  patientId: string;
};

function renderUrgency(priority?: string) {
  if (priority === 'urgent') return '⚡ urgent';
  if (priority === 'stat' || priority === 'asap') return '⚠️ emergency';
  return '📅 routine';
}

export default function ReferralsPanel({ patientId }: Props) {
  const [items, setItems] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Search latest ServiceRequests for this patient
        const bundle = await client.request(
          `ServiceRequest?patient=${encodeURIComponent(
            patientId
          )}&_sort=-_lastUpdated&_count=20`,
          { method: 'GET' }
        );
        const entries = bundle?.entry?.map((e: any) => e.resource) ?? [];
        if (mounted) setItems(entries);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load referrals');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (patientId) run();
    return () => {
      mounted = false;
    };
  }, [patientId]);

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (items.length === 0) return <div className="text-sm text-gray-500">No referrals.</div>;

  return (
    <ul className="space-y-2">
      {items.map((sr) => (
        <li key={sr.id} className="rounded border p-3">
          <div className="text-sm font-medium">
            {sr.code?.text ?? 'Referral'} · {sr.status ?? 'unknown'}
          </div>
          <div className="text-sm mt-1">Urgency Level: {renderUrgency(sr.priority)}</div>
        </li>
      ))}
    </ul>
  );
}
