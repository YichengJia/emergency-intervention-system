import React from 'react';
import { client } from '@/fhir/client';

type Props = {
  patientId: string;
  practitionerId: string;
  onBooked?: (id: string) => void;
};

export default function AppointmentScheduler({ patientId, practitionerId, onBooked }: Props) {
  const [start, setStart] = React.useState<string>(''); // ISO like 2025-09-17T08:00
  const [end, setEnd] = React.useState<string>('');     // ISO like 2025-09-17T08:30
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      resourceType: 'Appointment',
      status: 'booked',
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      participant: [
        { actor: { reference: `Patient/${patientId}` }, status: 'accepted' },
        { actor: { reference: `Practitioner/${practitionerId}` }, status: 'accepted' },
      ],
    };

    try {
      const created = await client.request('Appointment', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/fhir+json' },
      });
      onBooked?.(created?.id);
      // Do NOT hard-reload. Let parent refresh or poll.
      setStart('');
      setEnd('');
    } catch (err: any) {
      setError(err?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Start (local)</label>
        <input
          type="datetime-local"
          className="w-full rounded border p-2"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">End (local)</label>
        <input
          type="datetime-local"
          className="w-full rounded border p-2"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          required
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={submitting} type="submit">
        {submitting ? 'Booking…' : 'Book Appointment'}
      </button>
    </form>
  );
}
