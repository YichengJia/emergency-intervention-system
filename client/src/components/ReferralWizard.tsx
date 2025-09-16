// client/src/components/ReferralWizard.tsx
import React, { useState } from "react";

type Props = {
  onCreate: (specialty: string) => Promise<void>;
  onEducate?: () => void;
};

const REFERRAL_PATHWAYS: Record<string, { window: string }> = {
  "Primary Care": { window: "Within 3–7 days" },
  Cardiology: { window: "Within 2 weeks" },
  Endocrinology: { window: "Within 2–4 weeks" },
  Pulmonology: { window: "Within 2 weeks" },
  "Mental Health": { window: "Within 1 week" },
  "Pain Management": { window: "Within 2–3 weeks" },
  "Social Services": { window: "As soon as possible" },
};

const ReferralWizard: React.FC<Props> = ({ onCreate, onEducate }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState("");

  async function create() {
    if (!selectedSpecialty || locked) return;
    if (!window.confirm(`Confirm to create referral「${selectedSpecialty}」? You cannot modify it once created.`)) return;
    await onCreate(selectedSpecialty);
    setLocked(true);
    setMsg("A referral has been created.);
  }

  return (
    <div>
      <h3>Care Coordination & Referrals</h3>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label>Specialty:</label>
        <select
          disabled={locked}
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
        >
          <option value="">Select...</option>
          {Object.keys(REFERRAL_PATHWAYS).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <button disabled={!selectedSpecialty || locked} onClick={create}>
          Create Referral
        </button>
        {onEducate && (
          <button disabled={locked} onClick={onEducate}>
            Show Educational Resources
          </button>
        )}
      </div>
      {selectedSpecialty && !locked && (
        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          Recommended window: {REFERRAL_PATHWAYS[selectedSpecialty].window}
        </div>
      )}
      {msg && <div style={{ marginTop: 6, color: "#2f6" }}>{msg}</div>}
    </div>
  );
};

export default ReferralWizard;
