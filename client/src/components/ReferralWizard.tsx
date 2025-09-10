// client/src/components/ReferralWizard.tsx
import React, { useState } from "react";

interface Props {
  onCreate: (specialty: string) => Promise<void>;
  onEducate: (text: string) => Promise<void>;
}

const ReferralWizard: React.FC<Props> = ({ onCreate, onEducate }) => {
  const [specialty, setSpecialty] = useState("General Practice (GP)");
  const [edu, setEdu] = useState("Medication and diet education provided at discharge.");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async () => {
    setBusy(true);
    setMsg("");
    try {
      await onCreate(specialty);
      await onEducate(edu);
      setMsg("ServiceRequest + Communication created.");
    } catch (e: any) {
      setMsg(`Error: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Referral & Education</h3>
      <label>
        Specialty:
        <input
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          style={{ width: "100%", marginTop: 4 }}
        />
      </label>
      <label>
        Education message:
        <textarea
          value={edu}
          onChange={(e) => setEdu(e.target.value)}
          style={{ width: "100%", height: 80, marginTop: 4 }}
        />
      </label>
      <div style={{ marginTop: 8 }}>
        <button disabled={busy} onClick={run}>
          {busy ? "Submitting..." : "Create Referral + Communication"}
        </button>
        {msg && <span style={{ marginLeft: 12 }}>{msg}</span>}
      </div>
    </div>
  );
};

export default ReferralWizard;
