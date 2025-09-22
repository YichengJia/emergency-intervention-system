import React from 'react';
import { client } from '@/fhir/client'; // must expose SMART/FHIR client with .request

type Props = {
  patientId: string;
  practitionerId: string;
  onCreated?: (id: string) => void;
};

export default function ReferralForm({ patientId, practitionerId, onCreated }: Props) {
  const [service, setService] = React.useState('');
  const [urgency, setUrgency] = React.useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Map UI urgency to FHIR R4 ServiceRequest.priority
    const priorityMap: Record<string, 'routine' | 'urgent' | 'asap' | 'stat'> = {
      routine: 'routine',
      urgent: 'urgent',
      emergency: 'stat',
    };
    const priority = priorityMap[urgency] ?? 'routine';

    const body = {
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      priority,
      subject: { reference: `Patient/${patientId}` },
      requester: { reference: `Practitioner/${practitionerId}` },
      code: service
        ? {
            text: service,
          }
        : undefined,
    };

    try {
      const created = await client.request('ServiceRequest', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/fhir+json' },
      });
      onCreated?.(created?.id);
      setService('');
      setUrgency('routine');
    } catch (err: any) {
      setError(err?.message || 'Failed to create referral');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Service</label>
        <input
          className="w-full rounded border p-2"
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="e.g., Social Services"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium block">Urgency</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="urgency"
              value="routine"
              checked={urgency === 'routine'}
              onChange={() => setUrgency('routine')}
            />
            <span>📅 routine</span>
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="urgency"
              value="urgent"
              checked={urgency === 'urgent'}
              onChange={() => setUrgency('urgent')}
            />
            <span>⚡ urgent</span>
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="urgency"
              value="emergency"
              checked={urgency === 'emergency'}
              onChange={() => setUrgency('emergency')}
            />
            <span>⚠️ emergency</span>
          </label>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Submitting…' : 'Create Referral'}
      </button>
    </form>
  );
}
