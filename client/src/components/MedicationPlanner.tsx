// client/src/components/MedicationPlanner.tsx
import React from "react";

interface Props {
  meds: any[];
}

const MedicationPlanner: React.FC<Props> = ({ meds }) => {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Medication Overview</h3>
      {meds.length === 0 && <p>No current MedicationRequests found.</p>}
      {meds.map((m) => {
        const medText =
          m.medicationCodeableConcept?.text ||
          m.medicationCodeableConcept?.coding?.[0]?.display ||
          "Medication";
        const when = m.dosageInstruction?.[0]?.timing?.code?.text || "";
        const instruction = m.dosageInstruction?.[0]?.text || "";
        return (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <strong>{medText}</strong>
            {instruction && <div>{instruction}</div>}
            {when && <div style={{ fontSize: 12, color: "#666" }}>{when}</div>}
          </div>
        );
      })}
      <hr />
      <p style={{ fontSize: 12 }}>
        * Reminders simulated in UI for prototype; actual push messaging is out-of-scope for MVP.
      </p>
    </div>
  );
};

export default MedicationPlanner;
