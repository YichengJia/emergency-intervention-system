import React, { useState } from "react";

interface Props {
  onCreate: (summary: string) => Promise<void>;
}

const FollowUpScheduler: React.FC<Props> = ({ onCreate }) => {
  const [summary, setSummary] = useState(
    "Education on medication adherence and diet; GP follow-up in 7 days; review in 14/30 days."
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const handleCreate = async () => {
    setBusy(true);
    setMsg("");
    try {
      await onCreate(summary);
      setMsg("CarePlan created.");
    } catch (e: any) {
      setMsg(`Error: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
    >
      {/* Follow-up plan creator */}
      <h3 style={{ marginTop: 0 }}>Follow-up Plan</h3>
      <textarea
        style={{ width: "100%", height: 80 }}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
      <div style={{ marginTop: 8 }}>
        {/* Buttons and messages */}
        <button disabled={busy} onClick={handleCreate}>
          {busy ? "Creating..." : "Create CarePlan"}
        </button>
        {msg && <span style={{ marginLeft: 12 }}>{msg}</span>}
      </div>
    </div>
  );
};

export default FollowUpScheduler;