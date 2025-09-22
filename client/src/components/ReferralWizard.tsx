// client/src/components/ReferralWizard.tsx
// Intelligent referral system for care coordination and ED diversion

import React, { useState } from "react";

interface Props {
  onCreate: (specialty: string, reason: string, urgency: string) => Promise<void>;
  onEducate: (text: string) => Promise<void>;
}

const ReferralWizard: React.FC<Props> = ({ onCreate, onEducate }) => {
  const [specialty, setSpecialty] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    if (!specialty) {
      setMessage("Please select a specialty");
      return;
    }

    setIsCreating(true);
    setMessage("");

    try {
      // 传递所有三个参数
      await onCreate(specialty, reason, urgency);

      // 发送教育信息
      await onEducate(
        `Referral to ${specialty} has been created. Priority: ${urgency}. ${
          reason ? `Reason: ${reason}` : ''
        }`
      );

      setMessage("✅ Referral created successfully!");
      setSpecialty("");
      setReason("");
      setUrgency("routine");
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{
      border: "1px solid #FF9800",
      padding: 16,
      borderRadius: 8,
      margin: "12px 0",
      backgroundColor: "#FFF3E0"
    }}>
      <h3 style={{ margin: "0 0 12px 0", color: "#E65100" }}>
        🏥 Referral Wizard
      </h3>

      {/* Specialty Selection */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Select Specialty *
        </label>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd"
          }}
          disabled={isCreating}
        >
          <option value="">Choose specialty...</option>
          <option value="GP">Primary Care (GP)</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Endocrinology">Endocrinology</option>
          <option value="Nephrology">Nephrology</option>
          <option value="Pulmonology">Pulmonology</option>
          <option value="Neurology">Neurology</option>
          <option value="Gastroenterology">Gastroenterology</option>
          <option value="Rheumatology">Rheumatology</option>
          <option value="Psychiatry">Psychiatry</option>
          <option value="Pain Management">Pain Management</option>
        </select>
      </div>

      {/* Reason for Referral */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          What is the main reason for this referral?
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe symptoms, concerns, or specific needs..."
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

      {/* Urgency Level */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
          Urgency Level:
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center" }}>
            <input
              type="radio"
              value="routine"
              checked={urgency === "routine"}
              onChange={(e) => setUrgency(e.target.value)}
              disabled={isCreating}
            />
            <span style={{ marginLeft: 6 }}>📅 Routine</span>
          </label>
          <label style={{ display: "flex", alignItems: "center" }}>
            <input
              type="radio"
              value="urgent"
              checked={urgency === "urgent"}
              onChange={(e) => setUrgency(e.target.value)}
              disabled={isCreating}
            />
            <span style={{ marginLeft: 6 }}>⚡ Urgent</span>
          </label>
          <label style={{ display: "flex", alignItems: "center" }}>
            <input
              type="radio"
              value="stat"
              checked={urgency === "stat"}
              onChange={(e) => setUrgency(e.target.value)}
              disabled={isCreating}
            />
            <span style={{ marginLeft: 6 }}>⚠️ Emergency</span>
          </label>
        </div>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={isCreating || !specialty}
        style={{
          backgroundColor: isCreating || !specialty ? "#ccc" : "#FF6F00",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: 4,
          fontSize: 16,
          cursor: isCreating || !specialty ? "not-allowed" : "pointer",
          width: "100%"
        }}
      >
        {isCreating ? "Creating Referral..." : "Create Referral"}
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

export default ReferralWizard;