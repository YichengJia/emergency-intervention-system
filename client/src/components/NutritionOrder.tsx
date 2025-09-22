import React from 'react';
import { client } from '@/fhir/client';

type Props = {
  patientId: string;
  title?: string;
};

export default function NutritionOrders({ patientId, title = 'Nutrition Orders (latest)' }: Props) {
  const [order, setOrder] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use standard search param: patient={id}
        const bundle = await client.request(
          `NutritionOrder?patient=${encodeURIComponent(
            patientId
          )}&_sort=-_lastUpdated&_count=1`,
          { method: 'GET' }
        );
        const latest = bundle?.entry?.[0]?.resource ?? null;
        if (mounted) setOrder(latest);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load nutrition orders');
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
  if (!order) return <div className="text-sm text-gray-500">No nutrition orders.</div>;

  return (
    <div className="rounded border p-3 text-sm">
      <div className="font-medium">{title}</div>
      <div className="mt-1">
        {order.oralDiet?.type?.map((t: any) => t.text).filter(Boolean).join(', ') || 'Diet order'}
      </div>
      {order.allergyIntolerance?.length ? (
        <div className="mt-1">Allergies: {order.allergyIntolerance.map((a: any) => a.display || a.reference).join(', ')}</div>
      ) : null}
      {order.dateTime ? <div className="mt-1 text-gray-500">Last updated: {order.dateTime}</div> : null}
    </div>
  );
}
