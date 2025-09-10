// client/src/components/MedicationCalendar.tsx
// Simplified daily schedule UI for medication adherence logging.

import React, { useMemo, useState } from "react";
import {
  createMedicationStatement,
  createCommunicationToPractitioner
} from "../fhir";

interface MedicationCalendarProps {
  patient: any;
  meds: any[]; // MedicationRequest[]
  practitionerRef?: string; // "Practitioner/{id}" from fhirUser
  riskLevel: "LOW" | "MODERATE" | "HIGH";
}

function labelFor(m: any) {
  return (
    m?.medicationCodeableConcept?.text ||
    m?.medicationCodeableConcept?.coding?.[0]?.display ||
    "Medication"
  );
}

function buildTodaySchedule(meds: any[]) {
  // For MVP we generate 3 times; in production parse dosageInstruction.timing.
  const times = ["08:00", "12:00", "20:00"];
  // If multiple meds exist, you could flatten times x meds
  const medText = meds.length > 0 ? labelFor(meds[0]) : "Medication";
  return times.map((t) => ({ time: t, medText }));
}

const MedicationCalendar: React.FC<MedicationCalendarProps> = ({
  patient,
  meds,
  practitionerRef,
  riskLevel
}) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const today = useMemo(() => buildTodaySchedule(meds), [meds]);

  const submitIntake = async (taken: boolean, slot: { time: string; medText: string }) => {
    setBusy(true); setMsg("");
    try {
      const ts = new Date().toISOString();
      await createMedicationStatement(patient, slot.medText, taken, ts);

      // Notify the practitioner if missed or elevated risk
      if (!taken || riskLevel !== "LOW") {
        const text = taken
          ? `Patient ${patient.id} took ${slot.medText} at ${ts}.`
          : `Patient ${patient.id} missed ${slot.medText} expected at ${slot.time} (logged ${ts}).`;
        if (practitionerRef) {
          await createCommunicationToPractitioner(patient, text, practitionerRef);
        }
      }

      setMsg(taken ? "Recorded as taken." : "Recorded as missed.");
    } catch (e: any) {
      setMsg(`Error: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Medication Calendar (Today)</h3>
      {today.map((s, idx) => (
        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ minWidth: 80 }}>{s.time}</div>
          <div style={{ flex: 1 }}>{s.medText}</div>
          <button disabled={busy} onClick={() => submitIntake(true, s)}>Taken</button>
          <button disabled={busy} onClick={() => submitIntake(false, s)}>Missed</button>
        </div>
      ))}
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}

      <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
        * Simplified schedule for MVP. Parse dosageInstruction.timing in production.
      </p>
    </div>
  );
};

export default MedicationCalendar;
