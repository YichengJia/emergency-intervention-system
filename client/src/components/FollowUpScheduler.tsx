import React, { useState } from "react";

const FollowUpScheduler: React.FC<{ onCreate: (summary: string) => Promise<void> }> = ({ onCreate }) => {
  const [summary, setSummary] = useState("Education on medication adherence and diet; GP follow-up in 7 days; review in 14/30 days.");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const handleCreate = async () => {
    setBusy(true); setMsg("");
    try { await onCreate(summary); setMsg("CarePlan created."); }
    catch (e: any) { setMsg(`Error: ${e?.message || e}`); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, margin: "8px 0" }}>
      <b>Follow-up Plan</b>
      <textarea value={summary} onChange={(e) => setSummary(e.target.value)} style={{ width: "100%", height: 80, marginTop: 4 }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={handleCreate} disabled={busy}>{busy ? "Creating..." : "Create CarePlan"}</button>
        {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
      </div>
    </div>
  );
};
export default FollowUpScheduler;