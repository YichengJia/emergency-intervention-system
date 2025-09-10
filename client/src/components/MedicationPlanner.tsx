// client/src/components/MedicationPlanner.tsx
// Comprehensive medication management interface for adherence improvement

import React, { useState, useMemo } from "react";

interface MedicationRequest {
  id?: string;
  medicationCodeableConcept?: {
    text?: string;
    coding?: Array<{
      display?: string;
      code?: string;
      system?: string;
    }>;
  };
  dosageInstruction?: Array<{
    text?: string;
    timing?: {
      repeat?: {
        frequency?: number;
        period?: number;
        periodUnit?: string;
        when?: string[];
      };
      code?: {
        text?: string;
      };
    };
    doseAndRate?: Array<{
      doseQuantity?: {
        value?: number;
        unit?: string;
      };
    }>;
    route?: {
      text?: string;
    };
  }>;
  reasonCode?: Array<{
    text?: string;
  }>;
  note?: Array<{
    text?: string;
  }>;
}

interface Props {
  meds: MedicationRequest[];
}

const MedicationPlanner: React.FC<Props> = ({ meds }) => {
  const [expandedMed, setExpandedMed] = useState<string | null>(null);
  const [adherenceNotes, setAdherenceNotes] = useState<{ [key: string]: string }>({});

  // Categorize medications by time of day for easier planning
  const medicationSchedule = useMemo(() => {
    const schedule = {
      morning: [] as any[],
      afternoon: [] as any[],
      evening: [] as any[],
      bedtime: [] as any[],
      asNeeded: [] as any[]
    };

    meds.forEach(med => {
      const medName = med.medicationCodeableConcept?.text ||
                     med.medicationCodeableConcept?.coding?.[0]?.display ||
                     "Unknown Medication";

      const dosageText = med.dosageInstruction?.[0]?.text || "";
      const timing = med.dosageInstruction?.[0]?.timing;

      // Parse timing to categorize medication
      const medInfo = {
        id: med.id || Math.random().toString(),
        name: medName,
        dosage: dosageText,
        route: med.dosageInstruction?.[0]?.route?.text || "Oral",
        reason: med.reasonCode?.[0]?.text || "",
        instructions: med.note?.[0]?.text || "",
        raw: med
      };

      // Categorize based on timing information
      if (/morning|AM|breakfast/i.test(dosageText)) {
        schedule.morning.push(medInfo);
      } else if (/afternoon|noon|lunch/i.test(dosageText)) {
        schedule.afternoon.push(medInfo);
      } else if (/evening|PM|dinner/i.test(dosageText)) {
        schedule.evening.push(medInfo);
      } else if (/bedtime|night|HS/i.test(dosageText)) {
        schedule.bedtime.push(medInfo);
      } else if (/as needed|PRN/i.test(dosageText)) {
        schedule.asNeeded.push(medInfo);
      } else {
        // Default to morning if timing unclear
        schedule.morning.push(medInfo);
      }
    });

    return schedule;
  }, [meds]);

  // Calculate adherence complexity score
  const complexityScore = useMemo(() => {
    let score = 0;

    // Number of medications
    if (meds.length > 10) score += 3;
    else if (meds.length > 5) score += 2;
    else if (meds.length > 3) score += 1;

    // Multiple daily doses
    const multiDose = meds.filter(m =>
      /twice|TID|QID|three times|four times/i.test(m.dosageInstruction?.[0]?.text || "")
    ).length;
    if (multiDose > 3) score += 2;
    else if (multiDose > 0) score += 1;

    // Special instructions
    const specialInstructions = meds.filter(m =>
      /with food|empty stomach|avoid|do not/i.test(m.note?.[0]?.text || "")
    ).length;
    if (specialInstructions > 0) score += 1;

    return score;
  }, [meds]);

  // Generate adherence tips based on complexity
  const getAdherenceTips = () => {
    const tips = [];

    if (complexityScore >= 5) {
      tips.push("Consider using a weekly pill organizer with multiple daily compartments");
      tips.push("Set multiple phone alarms for medication times");
      tips.push("Ask your pharmacist about medication synchronization programs");
    } else if (complexityScore >= 3) {
      tips.push("Use a daily pill organizer to track doses");
      tips.push("Set phone reminders for medication times");
    }

    if (medicationSchedule.asNeeded.length > 0) {
      tips.push("Keep a log of when you take 'as needed' medications");
    }

    tips.push("Keep an updated medication list with you at all times");
    tips.push("Review medications with your pharmacist monthly");

    return tips;
  };

  const handleAdherenceNote = (medId: string, note: string) => {
    setAdherenceNotes(prev => ({ ...prev, [medId]: note }));
  };

  if (meds.length === 0) {
    return (
      <div style={{
        border: "1px solid #ddd",
        padding: 16,
        borderRadius: 8,
        margin: "12px 0",
        backgroundColor: "#f9f9f9"
      }}>
        <b>Medication Planner</b>
        <div style={{ marginTop: 8, color: "#666" }}>
          No active medications found. Please consult with your healthcare provider.
        </div>
      </div>
    );
  }

  const adherenceTips = getAdherenceTips();

  return (
    <div style={{
      border: "1px solid #2196F3",
      padding: 16,
      borderRadius: 8,
      margin: "12px 0",
      backgroundColor: "#f8f9fa"
    }}>
      {/* Header with complexity indicator */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12
      }}>
        <h3 style={{ margin: 0, color: "#1976D2" }}>
          📋 Medication Planner
        </h3>
        <div style={{
          padding: "4px 12px",
          borderRadius: 16,
          fontSize: 12,
          backgroundColor: complexityScore >= 5 ? "#ffebee" :
                          complexityScore >= 3 ? "#fff3e0" : "#e8f5e9",
          color: complexityScore >= 5 ? "#c62828" :
                complexityScore >= 3 ? "#ef6c00" : "#2e7d32"
        }}>
          Complexity: {complexityScore >= 5 ? "High" :
                      complexityScore >= 3 ? "Moderate" : "Low"}
        </div>
      </div>

      {/* Medication Summary */}
      <div style={{
        backgroundColor: "white",
        padding: 12,
        borderRadius: 6,
        marginBottom: 12
      }}>
        <div style={{ marginBottom: 8, fontSize: 14 }}>
          <b>Total Active Medications:</b> {meds.length}
        </div>

        {/* Daily Schedule Overview */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 8,
          marginTop: 12
        }}>
          {medicationSchedule.morning.length > 0 && (
            <div style={{
              padding: 8,
              backgroundColor: "#fff9c4",
              borderRadius: 4,
              border: "1px solid #f9a825"
            }}>
              <b style={{ fontSize: 12, color: "#f57f17" }}>🌅 Morning</b>
              <div style={{ fontSize: 20, fontWeight: "bold" }}>
                {medicationSchedule.morning.length}
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>medications</div>
            </div>
          )}

          {medicationSchedule.afternoon.length > 0 && (
            <div style={{
              padding: 8,
              backgroundColor: "#e1f5fe",
              borderRadius: 4,
              border: "1px solid #0288d1"
            }}>
              <b style={{ fontSize: 12, color: "#01579b" }}>☀️ Afternoon</b>
              <div style={{ fontSize: 20, fontWeight: "bold" }}>
                {medicationSchedule.afternoon.length}
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>medications</div>
            </div>
          )}

          {medicationSchedule.evening.length > 0 && (
            <div style={{
              padding: 8,
              backgroundColor: "#f3e5f5",
              borderRadius: 4,
              border: "1px solid #7b1fa2"
            }}>
              <b style={{ fontSize: 12, color: "#4a148c" }}>🌆 Evening</b>
              <div style={{ fontSize: 20, fontWeight: "bold" }}>
                {medicationSchedule.evening.length}
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>medications</div>
            </div>
          )}

          {medicationSchedule.bedtime.length > 0 && (
            <div style={{
              padding: 8,
              backgroundColor: "#e8eaf6",
              borderRadius: 4,
              border: "1px solid #3f51b5"
            }}>
              <b style={{ fontSize: 12, color: "#1a237e" }}>🌙 Bedtime</b>
              <div style={{ fontSize: 20, fontWeight: "bold" }}>
                {medicationSchedule.bedtime.length}
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>medications</div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Medication List */}
      <div style={{
        backgroundColor: "white",
        padding: 12,
        borderRadius: 6,
        marginBottom: 12
      }}>
        <b style={{ color: "#1976D2", marginBottom: 8, display: "block" }}>
          Your Medications:
        </b>

        {meds.map((med) => {
          const medId = med.id || Math.random().toString();
          const medName = med.medicationCodeableConcept?.text ||
                         med.medicationCodeableConcept?.coding?.[0]?.display ||
                         "Unknown Medication";
          const isExpanded = expandedMed === medId;

          return (
            <div key={medId} style={{
              marginBottom: 8,
              padding: 10,
              backgroundColor: "#fafafa",
              borderRadius: 4,
              border: "1px solid #e0e0e0"
            }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer"
                }}
                onClick={() => setExpandedMed(isExpanded ? null : medId)}
              >
                <div>
                  <strong style={{ color: "#333" }}>{medName}</strong>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    {med.dosageInstruction?.[0]?.text || "See instructions"}
                  </div>
                </div>
                <span style={{ fontSize: 20, color: "#666" }}>
                  {isExpanded ? "−" : "+"}
                </span>
              </div>

              {isExpanded && (
                <div style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid #e0e0e0"
                }}>
                  {med.dosageInstruction?.[0]?.route?.text && (
                    <div style={{ marginBottom: 6, fontSize: 13 }}>
                      <b>Route:</b> {med.dosageInstruction[0].route.text}
                    </div>
                  )}

                  {med.reasonCode?.[0]?.text && (
                    <div style={{ marginBottom: 6, fontSize: 13 }}>
                      <b>Reason:</b> {med.reasonCode[0].text}
                    </div>
                  )}

                  {med.note?.[0]?.text && (
                    <div style={{
                      marginBottom: 6,
                      fontSize: 13,
                      padding: 8,
                      backgroundColor: "#fff3cd",
                      borderRadius: 4,
                      border: "1px solid #ffc107"
                    }}>
                      <b>⚠️ Special Instructions:</b><br/>
                      {med.note[0].text}
                    </div>
                  )}

                  {/* Adherence tracking */}
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 13, color: "#666" }}>
                      Any issues with this medication?
                    </label>
                    <textarea
                      value={adherenceNotes[medId] || ""}
                      onChange={(e) => handleAdherenceNote(medId, e.target.value)}
                      placeholder="Note any side effects, difficulties, or concerns..."
                      style={{
                        width: "100%",
                        marginTop: 4,
                        padding: 6,
                        fontSize: 12,
                        borderRadius: 4,
                        border: "1px solid #ddd"
                      }}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Adherence Tips */}
      <div style={{
        backgroundColor: "#e3f2fd",
        padding: 12,
        borderRadius: 6,
        border: "1px solid #90caf9"
      }}>
        <b style={{ color: "#1565c0" }}>💡 Adherence Tips:</b>
        <ul style={{
          margin: "8px 0 0 20px",
          padding: 0,
          fontSize: 13
        }}>
          {adherenceTips.map((tip, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: 12,
        fontSize: 11,
        color: "#666",
        fontStyle: "italic",
        textAlign: "center"
      }}>
        Always consult your healthcare provider before making any changes to your medications.
        Report any side effects or concerns immediately.
      </div>
    </div>
  );
};

export default MedicationPlanner;