import React, { useState } from "react";

interface Props {
  onCreate: (instruction: string, dietType: string, symptoms: string) => Promise<void>;
}

const NutritionPlanner: React.FC<Props> = ({ onCreate }) => {
  const [dietType, setDietType] = useState("");
  const [instruction, setInstruction] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    if (!dietType || !instruction) {
      setMessage("Please select diet type and provide instructions");
      return;
    }

    setIsCreating(true);
    setMessage("");

    try {
      // 传递所有三个参数
      await onCreate(instruction, dietType, symptoms);
      
      setMessage("✅ Nutrition order created successfully!");
      setDietType("");
      setInstruction("");
      setSymptoms("");
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{
      border: "1px solid #4CAF50",
      padding: 16,
      borderRadius: 8,
      margin: "12px 0",
      backgroundColor: "#E8F5E9"
    }}>
      <h3 style={{ margin: "0 0 12px 0", color: "#2E7D32" }}>
        🥗 Nutrition Planner
      </h3>

      {/* Diet Type Selection */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Select Dietary Protocol Based on Your Conditions *
        </label>
        <select
          value={dietType}
          onChange={(e) => setDietType(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd"
          }}
          disabled={isCreating}
        >
          <option value="">Choose diet type...</option>
          <option value="cardiac">❤️ Cardiac Diet (Low sodium, low fat)</option>
          <option value="diabetic">🩺 Diabetic Diet (Carb controlled)</option>
          <option value="renal">🫘 Renal Diet (Low protein, potassium)</option>
          <option value="low-sodium">🧂 Low Sodium Diet</option>
          <option value="mediterranean">🌊 Mediterranean Diet</option>
          <option value="plant-based">🌱 Plant-Based Diet</option>
          <option value="general">📋 General Healthy Diet</option>
        </select>
      </div>

      {/* Additional Instructions */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Additional Dietary Instructions or Allergies *
        </label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Include any food allergies, preferences, or special instructions..."
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
            minHeight: 80
          }}
          disabled={isCreating}
        />
      </div>

      {/* Symptoms to Monitor */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Diet-Related Symptoms to Monitor:
        </label>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Note any symptoms to track (e.g., bloating, nausea, energy levels)..."
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
            minHeight: 60
          }}
          disabled={isCreating}
        />
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={isCreating || !dietType || !instruction}
        style={{
          backgroundColor: isCreating || !dietType || !instruction ? "#ccc" : "#4CAF50",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: 4,
          fontSize: 16,
          cursor: isCreating || !dietType || !instruction ? "not-allowed" : "pointer",
          width: "100%"
        }}
      >
        {isCreating ? "Creating Nutrition Order..." : "Create Nutrition Order"}
      </button>

      {/* Status Message */}
      {message && (
        <div style={{
          marginTop: 12,
          padding: 10,
          backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
          color: message.includes("✅") ? "#155724" : "#721c24",
          borderRadius: 4
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default NutritionPlanner;
