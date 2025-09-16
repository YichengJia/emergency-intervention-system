// client/src/components/MedicationCalendar.tsx
import React, { useState } from "react";
import { createMedicationStatement } from "../fhir";

type Props = {
  patient: any;
  meds: any[];
  practitionerRef?: string;
  riskLevel?: string;
};

const Confirm: React.FC<{
  open: boolean;
  text: string;
  onYes: () => void | Promise<void>;
  onNo: () => void;
}> = ({ open, text, onYes, onNo }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 20 }}>
      <div style={{ background: "#fff", padding: 16, borderRadius: 8, width: 320, margin: "20vh auto" }}>
        <div style={{ marginBottom: 12 }}>{text}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onNo}>Cancel</button>
          <button onClick={onYes}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

const Slot: React.FC<{
  label: string;
  locked: boolean;
  msg: string;
  onConfirm: (taken: boolean) => Promise<void>;
}> = ({ label, locked, msg, onConfirm }) => {
  const [ask, setAsk] = useState<null | boolean>(null);
  const doAction = async () => {
    if (ask === null) return;
    await onConfirm(ask);
    setAsk(null);
  };
  return (
    <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button disabled={locked} onClick={() => setAsk(true)}>
          Medication Taken
        </button>
        <button disabled={locked} onClick={() => setAsk(false)}>
          Missed
        </button>
      </div>
      <div style={{ marginTop: 6, color: "#555", minHeight: 18 }}>{msg}</div>
      <Confirm
        open={ask !== null}
        text={`Are you sure to mark as「${ask ? "Taken" : "Missed"}」? You cannot change after decision.`}
        onYes={doAction}
        onNo={() => setAsk(null)}
      />
    </div>
  );
};

const MedicationCalendar: React.FC<Props> = ({ patient, meds, practitionerRef }) => {
  const [amLocked, setAmLocked] = useState(false);
  const [pmLocked, setPmLocked] = useState(false);
  const [amMsg, setAmMsg] = useState("");
  const [pmMsg, setPmMsg] = useState("");

  async function confirmDose(slot: "AM" | "PM", taken: boolean) {
    const tsDate = new Date();
    tsDate.setHours(slot === "AM" ? 8 : 20, 0, 0, 0);
    const ts = tsDate.toISOString();
    const medText =
      meds
        .map(
          (m: any) => m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display
        )
        .filter(Boolean)
        .join(", ") || "Medication";
    await createMedicationStatement(patient, medText, taken, ts, slot, practitionerRef);
    if (slot === "AM") {
      setAmLocked(true);
      setAmMsg(taken ? "Recorded as taken." : "Recorded as missed.");
    } else {
      setPmLocked(true);
      setPmMsg(taken ? "Recorded as taken." : "Recorded as missed.");
    }
  }

  return (
    <div>
      <h3>Medication Calendar (Today)</h3>
      <div style={{ display: "flex", gap: 12 }}>
        <Slot label="08:00" locked={amLocked} msg={amMsg} onConfirm={(t) => confirmDose("AM", t)} />
        <Slot label="20:00" locked={pmLocked} msg={pmMsg} onConfirm={(t) => confirmDose("PM", t)} />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
        * Schedule parsing is simplified for MVP. Parse full timing in production.
      </div>
    </div>
  );
};

export default MedicationCalendar;
