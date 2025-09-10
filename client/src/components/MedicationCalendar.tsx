import React, { useMemo, useState } from "react";
import { createMedicationStatement, createCommunicationToPractitioner } from "../fhir";
import { parseTimesFromDosageText } from "../timing";

const MedicationCalendar: React.FC<{
  patient: any;
  meds: any[];
  practitionerRef?: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
}> = ({ patient, meds, practitionerRef, riskLevel }) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const today = useMemo(() => {
    // Build schedule per medication using timing text if available
    const entries: { time: string; medText: string }[] = [];
    for (const m of meds) {
      const medText = m?.medicationCodeableConcept?.text || m?.medicationCodeableConcept?.coding?.[0]?.display || "Medication";
      const text = m?.dosageInstruction?.[0]?.text || m?.dosageInstruction?.[0]?.timing?.code?.text || "";
      for (const t of parseTimesFromDosageText(text)) entries.push({ time: t, medText });
    }
    if (entries.length === 0) return [{ time: "08:00", medText: "Medication" }, { time: "20:00", medText: "Medication" }];
    // Sort by HH:mm
    return entries.sort((a, b) => a.time.localeCompare(b.time));
  }, [meds]);

  const submitIntake = async (taken: boolean, slot: { time: string; medText: string }) => {
    setBusy(true); setMsg("");
    try {
      const ts = new Date().toISOString();
      await createMedicationStatement(patient, slot.medText, taken, ts);
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
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, margin: "8px 0" }}>
      <b>Medication Calendar (Today)</b>
      {today.map((s, idx) => (
        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <div style={{ width: 60 }}>{s.time}</div>
          <div style={{ flex: 1 }}>{s.medText}</div>
          <button onClick={() => submitIntake(true, s)} disabled={busy}>Taken</button>
          <button onClick={() => submitIntake(false, s)} disabled={busy}>Missed</button>
        </div>
      ))}
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
      <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
        * Schedule parsing is simplified for MVP. Parse full timing in production.
      </div>
    </div>
  );
};
export default MedicationCalendar;