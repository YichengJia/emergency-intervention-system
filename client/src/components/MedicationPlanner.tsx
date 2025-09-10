import React from "react";

const MedicationPlanner: React.FC<{ meds: any[] }> = ({ meds }) => {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, margin: "8px 0" }}>
      <b>Medication Overview</b>
      {meds.length === 0 && <div>No current MedicationRequests found.</div>}
      {meds.map((m, idx) => {
        const medText =
          m.medicationCodeableConcept?.text ||
          m.medicationCodeableConcept?.coding?.[0]?.display || "Medication";
        const when = m.dosageInstruction?.[0]?.timing?.code?.text || "";
        const instruction = m.dosageInstruction?.[0]?.text || "";
        return (
          <div key={idx} style={{ padding: 8, background: "#fafafa", marginTop: 8, borderRadius: 6 }}>
            <div><b>{medText}</b></div>
            {instruction && <div>{instruction}</div>}
            {when && <div>{when}</div>}
          </div>
        );
      })}
      <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
        * Reminders are simulated in UI for prototype; push messaging is out-of-scope for MVP.
      </div>
    </div>
  );
};
export default MedicationPlanner;