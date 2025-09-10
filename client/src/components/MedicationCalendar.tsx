// client/src/components/MedicationCalendar.tsx
import React, { useMemo, useState } from "react";
import { createMedicationStatement, createCommunication } from "../fhir";

interface MedicationCalendarProps {
  patient: any;
  meds: any[]; // MedicationRequest[]
  practitionerRef?: string; // "Practitioner/{id}" from fhirUser
  riskLevel: "LOW" | "MODERATE" | "HIGH";
}

function buildSchedule(meds: any[], date: Date) {
  // VERY simplified: generate 3 "expected intakes" for today if timing unspecified
  // In production: parse dosageInstruction[*].timing (code / repeat) to compute times
  const times = ["08:00", "12:00", "20:00"];
  return times.map((t) => ({ time: t, medText: labelFor(meds[0]) }));
}

function labelFor(m: any) {
  return (
    m?.medicationCodeableConcept?.text ||
    m?.medicationCodeableConcept?.coding?.[0]?.display ||
    "Medication"
  );
}

const MedicationCalendar: React.FC<MedicationCalendarProps> = ({
  patient, meds, practitionerRef, riskLevel
}) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const todaySchedule = useMemo(() => buildSchedule(meds, new Date()), [meds]);

  const submitIntake = async (taken: boolean, slot: { time: string, medText: string }) => {
    setBusy(true); setMsg("");
    try {
      const ts = new Date().toISOString();
      // 1) Write MedicationStatement (self-reported)
      await createMedicationStatement(patient, slot.medText, taken, ts);
      // 2) If missed OR high risk, notify practitioner via Communication
      if (!taken || riskLevel !== "LOW") {
        const text = taken
          ? `Patient ${patient.id} took ${slot.medText} at ${ts}.`
          : `Patient ${patient.id} missed ${slot.medText} expected at ${slot.time} (${ts}).`;
        if (practitionerRef) {
          await createCommunication(patient, text, practitionerRef);
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
    <div style={{border: "1px solid #ddd", borderRadius: 8, padding: 12}}>
      <h3 style={{marginTop: 0}}>Medication Calendar (Today)</h3>
      {todaySchedule.map((s, idx) => (
        <div key={idx} style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 8}}>
          <div style={{minWidth: 80}}>{s.time}</div>
          <div style={{flex: 1}}>{s.medText}</div>
          <button disabled={busy} onClick={() => submitIntake(true, s)}>Taken</button>
          <button disabled={busy} onClick={() => submitIntake(false, s)}>Missed</button>
        </div>
      ))}
      {msg && <div style={{marginTop: 8}}>{msg}</div>}
      <p style={{fontSize: 12, color: "#666", marginTop: 8}}>
        * This is a simplified schedule. Real schedules should parse dosageInstruction.timing.
      </p>
    </div>
  );
};

export default MedicationCalendar;
