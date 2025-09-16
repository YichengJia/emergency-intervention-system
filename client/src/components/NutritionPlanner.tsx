// client/src/components/NutritionPlanner.tsx
import React, { useState } from "react";

type Props = {
  onCreate: (instruction: string) => Promise<void>;
};

const NutritionPlanner: React.FC<Props> = ({ onCreate }) => {
  const [instruction, setInstruction] = useState("");
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    const text = instruction.trim() || "Patient-specific dietary instruction saved.";
    await onCreate(text);
    setLocked(true);
    setMsg("Nutrition Planner already exists.");
  }

  return (
    <div>
      <h3>Nutrition & Diet Management</h3>
      <textarea
        disabled={locked}
        placeholder="Additional Dietary Instructions or Allergies..."
        style={{ width: "100%", minHeight: 80 }}
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
      />
      <div style={{ marginTop: 8 }}>
        <button disabled={locked} onClick={save}>
          Save Nutrition Plan
        </button>
      </div>
      {msg && <div style={{ marginTop: 6, color: "#2f6" }}>{msg}</div>}
    </div>
  );
};

export default NutritionPlanner;
