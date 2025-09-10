import React, { useState } from "react";

const AppointmentScheduler: React.FC<{ onCreate: (title: string, startIso: string) => Promise<void> }> = ({ onCreate }) => {
  const [title, setTitle] = useState("GP follow-up");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async () => {
    if (!date) { setMsg("Select a date."); return; }
    const startIso = new Date(`${date}T${time}:00`).toISOString();
    setBusy(true); setMsg("");
    try { await onCreate(title, startIso); setMsg("Appointment created."); }
    catch (e: any) { setMsg(`Error: ${e?.message || String(e)}`); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, margin: "8px 0" }}>
      <b>Follow-up Appointment</b>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={run} disabled={busy}>{busy ? "Submitting..." : "Create Appointment"}</button>
        {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
      </div>
    </div>
  );
};
export default AppointmentScheduler;