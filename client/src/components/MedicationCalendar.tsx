import React, { useState } from "react";
import { createMedicationStatement } from "../fhir";

interface Props {
  patient: any;
  meds: any[];
  practitionerRef?: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
}

/**
 * Minimal AM/PM calendar that:
 * - keeps AM/PM independent confirmation
 * - locks slot after confirmation
 * - sends MedicationStatement & optional clinician notification
 */
const MedicationCalendar: React.FC<Props> = ({ patient, meds, practitionerRef }) => {
  const [amLocked, setAmLocked] = useState(false);
  const [pmLocked, setPmLocked] = useState(false);
  const [amMsg, setAmMsg] = useState<string>("");
  const [pmMsg, setPmMsg] = useState<string>("");

  const medName = meds?.[0]?.medicationCodeableConcept?.text
    || meds?.[0]?.medicationCodeableConcept?.coding?.[0]?.display
    || "Medication";

  async function confirmDose(slot: "AM" | "PM", taken: boolean) {
    const base = new Date();
    base.setMinutes(0, 0, 0);
    if (slot === "AM") base.setHours(8);
    else base.setHours(20);
    const iso = base.toISOString();

    await createMedicationStatement(
      patient,
      medName,
      taken,
      iso,
      slot,
      practitionerRef
    );

    if (slot === "AM") {
      setAmMsg(taken ? "Recorded as taken." : "Recorded as missed.");
      setAmLocked(true);
    } else {
      setPmMsg(taken ? "Recorded as taken." : "Recorded as missed.");
      setPmLocked(true);
    }
  }

  return (
    <div style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, marginTop: 12 }}>
      <h3>Medication Calendar (Today)</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* AM slot */}
        <div style={{ border: "1px solid #ddd", padding: 8, borderRadius: 6 }}>
          <div style={{ fontWeight: 600 }}>08:00</div>
          <div>Medication</div>
          <div style={{ marginTop: 6 }}>
            <button disabled={amLocked} onClick={() => confirmDose("AM", true)}>Taken</button>{" "}
            <button disabled={amLocked} onClick={() => confirmDose("AM", false)}>Missed</button>
          </div>
          <div style={{ marginTop: 6, color: "#555" }}>{amMsg}</div>
        </div>

        {/* PM slot */}
        <div style={{ border: "1px solid #ddd", padding: 8, borderRadius: 6 }}>
          <div style={{ fontWeight: 600 }}>20:00</div>
          <div>Medication</div>
          <div style={{ marginTop: 6 }}>
            <button disabled={pmLocked} onClick={() => confirmDose("PM", true)}>Taken</button>{" "}
            <button disabled={pmLocked} onClick={() => confirmDose("PM", false)}>Missed</button>
          </div>
          <div style={{ marginTop: 6, color: "#555" }}>{pmMsg}</div>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
        * Schedule parsing is simplified for MVP. Parse full timing in production.
      </div>
    </div>
  );
};

export default MedicationCalendar;
