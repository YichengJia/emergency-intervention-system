import React, { useState } from "react";

const NutritionPlanner: React.FC<{ onCreate: (instruction: string) => Promise<void> }> = ({ onCreate }) => {
  const [instruction, setInstruction] = useState("Low-sodium diet with reduced saturated fat; avoid sugary drinks; 5 servings of vegetables per day.");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async () => {
    setBusy(true); setMsg("");
    try { await onCreate(instruction); setMsg("NutritionOrder created."); }
    catch (e: any) { setMsg(`Error: ${e?.message || String(e)}`); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, margin: "8px 0" }}>
      <b>Nutrition Plan</b>
      <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} style={{ width: "100%", height: 80, marginTop: 4 }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={run} disabled={busy}>{busy ? "Submitting..." : "Create NutritionOrder"}</button>
        {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
      </div>
    </div>
  );
};
export default NutritionPlanner;