import React, { useState } from "react";

const ReferralWizard: React.FC<{
  onCreate: (specialty: string) => Promise<void>;
  onEducate: (text: string) => Promise<void>;
}> = ({ onCreate, onEducate }) => {
  const [specialty, setSpecialty] = useState("General Practice (GP)");
  const [edu, setEdu] = useState("Medication and diet education provided at discharge.");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async () => {
    setBusy(true); setMsg("");
    try { await onCreate(specialty); await onEducate(edu); setMsg("ServiceRequest + Communication created."); }
    catch (e: any) { setMsg(`Error: ${e?.message || e}`); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, margin: "8px 0" }}>
      <b>Referral & Education</b>
      <div style={{ marginTop: 6 }}>Specialty:</div>
      <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={{ width: "100%", marginTop: 4 }} />
      <div style={{ marginTop: 6 }}>Education message:</div>
      <textarea value={edu} onChange={(e) => setEdu(e.target.value)} style={{ width: "100%", height: 80, marginTop: 4 }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={run} disabled={busy}>{busy ? "Submitting..." : "Create Referral + Communication"}</button>
        {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
      </div>
    </div>
  );
};
export default ReferralWizard;