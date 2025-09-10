// client/src/components/ReferralWizard.tsx
// Intelligent referral system for care coordination and ED diversion

import React, { useState, useMemo } from "react";

interface Props {
  onCreate: (specialty: string) => Promise<void>;
  onEducate: (message: string) => Promise<void>;
}

// Evidence-based referral pathways for common ED presentations
const REFERRAL_PATHWAYS = {
  "Primary Care": {
    icon: "👨‍⚕️",
    description: "General health management and preventive care",
    conditions: [
      "Medication management",
      "Chronic disease follow-up",
      "Preventive screenings",
      "Minor acute illnesses",
      "Health maintenance"
    ],
    urgency: "Within 3-7 days",
    educationPoints: [
      "Your primary care provider is your medical home",
      "They coordinate all aspects of your healthcare",
      "Regular visits prevent emergency situations"
    ]
  },
  "Cardiology": {
    icon: "❤️",
    description: "Heart and cardiovascular system specialists",
    conditions: [
      "Chest pain (non-emergency)",
      "Heart failure management",
      "Arrhythmia follow-up",
      "Hypertension (uncontrolled)",
      "Post-cardiac event care"
    ],
    urgency: "Within 2 weeks",
    educationPoints: [
      "Monitor blood pressure daily",
      "Take heart medications as prescribed",
      "Recognize warning signs: chest pain, shortness of breath"
    ]
  },
  "Endocrinology": {
    icon: "🔬",
    description: "Hormone and metabolic disorder specialists",
    conditions: [
      "Diabetes (uncontrolled)",
      "Thyroid disorders",
      "Metabolic syndrome",
      "Osteoporosis",
      "Hormone imbalances"
    ],
    urgency: "Within 2-4 weeks",
    educationPoints: [
      "Check blood sugar as directed",
      "Maintain a diabetes diary",
      "Follow dietary recommendations strictly"
    ]
  },
  "Pulmonology": {
    icon: "🫁",
    description: "Lung and respiratory system specialists",
    conditions: [
      "COPD management",
      "Asthma (poorly controlled)",
      "Sleep apnea",
      "Chronic cough",
      "Oxygen therapy needs"
    ],
    urgency: "Within 2 weeks",
    educationPoints: [
      "Use inhalers correctly with spacer",
      "Monitor peak flow if prescribed",
      "Avoid triggers and irritants"
    ]
  },
  "Mental Health": {
    icon: "🧠",
    description: "Psychiatric and psychological care",
    conditions: [
      "Depression",
      "Anxiety disorders",
      "Substance use",
      "Medication management",
      "Crisis prevention"
    ],
    urgency: "Within 1 week",
    educationPoints: [
      "Mental health is as important as physical health",
      "Medications may take time to work",
      "Crisis helpline: 988 (US) for immediate support"
    ]
  },
  "Pain Management": {
    icon: "💊",
    description: "Chronic pain specialists",
    conditions: [
      "Chronic back pain",
      "Neuropathy",
      "Arthritis pain",
      "Post-surgical pain",
      "Medication optimization"
    ],
    urgency: "Within 2-3 weeks",
    educationPoints: [
      "Keep a pain diary",
      "Try non-medication approaches",
      "Physical therapy can be very effective"
    ]
  },
  "Social Services": {
    icon: "🤝",
    description: "Community support and resources",
    conditions: [
      "Housing assistance",
      "Food insecurity",
      "Transportation barriers",
      "Insurance navigation",
      "Caregiver support"
    ],
    urgency: "As soon as possible",
    educationPoints: [
      "Social factors greatly impact health",
      "Many community resources are available",
      "Case managers can coordinate services"
    ]
  }
};

const ReferralWizard: React.FC<Props> = ({ onCreate, onEducate }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [showEducation, setShowEducation] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<"routine" | "urgent" | "emergency">("routine");
  const [referralReason, setReferralReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Determine recommended specialties based on typical ED presentations
  const recommendedSpecialties = useMemo(() => {
    const recommendations = [];

    // Always recommend primary care as first option
    recommendations.push({
      specialty: "Primary Care",
      priority: 1,
      reason: "Essential for ongoing care coordination"
    });

    // Add condition-specific recommendations
    if (referralReason.toLowerCase().includes("chest") ||
        referralReason.toLowerCase().includes("heart")) {
      recommendations.push({
        specialty: "Cardiology",
        priority: 2,
        reason: "Cardiac symptoms require specialist evaluation"
      });
    }

    if (referralReason.toLowerCase().includes("breath") ||
        referralReason.toLowerCase().includes("asthma") ||
        referralReason.toLowerCase().includes("copd")) {
      recommendations.push({
        specialty: "Pulmonology",
        priority: 2,
        reason: "Respiratory issues need specialist care"
      });
    }

    if (referralReason.toLowerCase().includes("diabetes") ||
        referralReason.toLowerCase().includes("sugar")) {
      recommendations.push({
        specialty: "Endocrinology",
        priority: 2,
        reason: "Diabetes management requires specialist input"
      });
    }

    if (referralReason.toLowerCase().includes("anxious") ||
        referralReason.toLowerCase().includes("depress") ||
        referralReason.toLowerCase().includes("stress")) {
      recommendations.push({
        specialty: "Mental Health",
        priority: 2,
        reason: "Mental health support is crucial"
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }, [referralReason]);

  const handleCreateReferral = async () => {
    if (!selectedSpecialty) {
      setMessage("Please select a specialty for referral");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      // Create the referral
      await onCreate(selectedSpecialty);

      // Send educational materials to patient
      const pathway = REFERRAL_PATHWAYS[selectedSpecialty as keyof typeof REFERRAL_PATHWAYS];
      if (pathway) {
        const educationMessage = `
Referral to ${selectedSpecialty} - What You Need to Know:

${pathway.description}

Important Points:
${pathway.educationPoints.map(point => `• ${point}`).join('\n')}

Appointment Timeline: ${pathway.urgency}

This referral will help address: ${referralReason || "your healthcare needs"}

Remember: Following up with specialists as recommended helps prevent emergency visits.
Contact your primary care provider if you have questions about this referral.
        `.trim();

        await onEducate(educationMessage);
      }

      setMessage(`Referral to ${selectedSpecialty} created successfully`);

      // Reset form after success
      setTimeout(() => {
        setSelectedSpecialty("");
        setReferralReason("");
        setMessage("");
      }, 3000);

    } catch (error: any) {
      setMessage(`Error: ${error?.message || "Failed to create referral"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      border: "1px solid #4CAF50",
      padding: 16,
      borderRadius: 8,
      margin: "12px 0",
      backgroundColor: "#f8f9fa"
    }}>
      {/* Header */}
      <h3 style={{ margin: "0 0 12px 0", color: "#2E7D32" }}>
        🔄 Care Coordination & Referrals
      </h3>

      {/* Referral Reason Input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 6,
          fontWeight: "bold",
          fontSize: 14
        }}>
          What is the main reason for this referral?
        </label>
        <textarea
          value={referralReason}
          onChange={(e) => setReferralReason(e.target.value)}
          placeholder="Describe symptoms, conditions, or concerns that need follow-up..."
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
            fontSize: 14,
            minHeight: 60
          }}
        />
      </div>

      {/* Recommended Specialties */}
      {recommendedSpecialties.length > 0 && referralReason && (
        <div style={{
          backgroundColor: "#e8f5e9",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          border: "1px solid #a5d6a7"
        }}>
          <b style={{ color: "#1b5e20", fontSize: 14 }}>
            📋 Recommended Referrals Based on Your Input:
          </b>
          <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
            {recommendedSpecialties.map((rec, idx) => (
              <li key={idx} style={{
                marginBottom: 4,
                fontSize: 13,
                color: "#2e7d32"
              }}>
                <strong>{rec.specialty}</strong> - {rec.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Specialty Selection Grid */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 8,
          fontWeight: "bold",
          fontSize: 14
        }}>
          Select Specialty for Referral:
        </label>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 8
        }}>
          {Object.entries(REFERRAL_PATHWAYS).map(([specialty, info]) => (
            <div
              key={specialty}
              onClick={() => setSelectedSpecialty(specialty)}
              style={{
                padding: 12,
                border: `2px solid ${selectedSpecialty === specialty ? "#4CAF50" : "#e0e0e0"}`,
                borderRadius: 6,
                cursor: "pointer",
                backgroundColor: selectedSpecialty === specialty ? "#e8f5e9" : "white",
                transition: "all 0.2s"
              }}
            >
              <div style={{
                fontSize: 24,
                marginBottom: 4,
                textAlign: "center"
              }}>
                {info.icon}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: "bold",
                textAlign: "center",
                color: selectedSpecialty === specialty ? "#2e7d32" : "#333"
              }}>
                {specialty}
              </div>
              <div style={{
                fontSize: 11,
                color: "#666",
                marginTop: 4,
                textAlign: "center"
              }}>
                {info.urgency}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Specialty Details */}
      {selectedSpecialty && (
        <div style={{
          backgroundColor: "white",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          border: "1px solid #ddd"
        }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#2e7d32" }}>
            {REFERRAL_PATHWAYS[selectedSpecialty as keyof typeof REFERRAL_PATHWAYS].icon} {selectedSpecialty}
          </h4>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
            {REFERRAL_PATHWAYS[selectedSpecialty as keyof typeof REFERRAL_PATHWAYS].description}
          </p>
          <div>
            <b style={{ fontSize: 13 }}>Common conditions treated:</b>
            <ul style={{ margin: "4px 0 0 20px", padding: 0, fontSize: 12 }}>
              {REFERRAL_PATHWAYS[selectedSpecialty as keyof typeof REFERRAL_PATHWAYS].conditions.map((condition, idx) => (
                <li key={idx}>{condition}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Urgency Level */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 6,
          fontWeight: "bold",
          fontSize: 14
        }}>
          Urgency Level:
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {["routine", "urgent", "emergency"].map((level) => (
            <button
              key={level}
              onClick={() => setUrgencyLevel(level as any)}
              style={{
                padding: "6px 16px",
                borderRadius: 4,
                border: urgencyLevel === level ? "2px solid #4CAF50" : "1px solid #ddd",
                backgroundColor: urgencyLevel === level ? "#e8f5e9" : "white",
                cursor: "pointer",
                fontSize: 13,
                textTransform: "capitalize"
              }}
            >
              {level === "emergency" && "⚠️ "}
              {level === "urgent" && "⚡ "}
              {level === "routine" && "📅 "}
              {level}
            </button>
          ))}
        </div>
        {urgencyLevel === "emergency" && (
          <div style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: "#ffebee",
            borderRadius: 4,
            fontSize: 12,
            color: "#c62828"
          }}>
            ⚠️ For emergency situations, please call 911 or visit the nearest emergency department
          </div>
        )}
      </div>

      {/* Educational Information Toggle */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowEducation(!showEducation)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#fff3e0",
            border: "1px solid #ff9800",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 13
          }}
        >
          💡 {showEducation ? "Hide" : "Show"} Educational Resources
        </button>

        {showEducation && (
          <div style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: "#fff9c4",
            borderRadius: 6,
            fontSize: 13
          }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#f57c00" }}>
              When to Use Different Care Settings:
            </h4>
            <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
              <li><b>Primary Care:</b> Routine check-ups, medication refills, minor illnesses</li>
              <li><b>Urgent Care:</b> Non-emergency issues needing same-day care</li>
              <li><b>Emergency Department:</b> Life-threatening conditions only</li>
              <li><b>Specialist:</b> Specific conditions requiring expert care</li>
              <li><b>Telehealth:</b> Follow-ups, medication questions, minor concerns</li>
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: "flex",
        gap: 8,
        marginTop: 16
      }}>
        <button
          onClick={handleCreateReferral}
          disabled={busy || !selectedSpecialty}
          style={{
            padding: "10px 20px",
            backgroundColor: selectedSpecialty ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: selectedSpecialty ? "pointer" : "not-allowed",
            fontSize: 14,
            fontWeight: "bold"
          }}
        >
          {busy ? "Creating..." : "Create Referral"}
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div style={{
          marginTop: 12,
          padding: 10,
          backgroundColor: message.includes("Error") ? "#ffebee" : "#e8f5e9",
          borderRadius: 4,
          color: message.includes("Error") ? "#c62828" : "#2e7d32",
          fontSize: 13
        }}>
          {message}
        </div>
      )}

      {/* Footer Note */}
      <div style={{
        marginTop: 16,
        fontSize: 11,
        color: "#666",
        fontStyle: "italic",
        textAlign: "center",
        padding: "8px 0",
        borderTop: "1px solid #e0e0e0"
      }}>
        Appropriate referrals to outpatient care reduce unnecessary emergency visits
        and improve health outcomes. Always follow up within the recommended timeframe.
      </div>
    </div>
  );
};

export default ReferralWizard;