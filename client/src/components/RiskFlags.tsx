// client/src/components/RiskFlags.tsx
// Risk assessment visualization for emergency readmission prevention

import React from "react";

// Type definition for risk assessment summary
export interface RiskSummary {
  edCount12m: number;  // Number of ED visits in the last 12 months
  risk: "LOW" | "MODERATE" | "HIGH";
  conditions: string[];  // List of chronic conditions
}

interface Props {
  summary?: RiskSummary;
}

const RiskFlags: React.FC<Props> = ({ summary }) => {
  if (!summary) {
    return (
      <div style={{
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 8,
        margin: "8px 0",
        backgroundColor: "#f9f9f9"
      }}>
        <b>Risk Assessment</b>
        <div style={{ marginTop: 8, color: "#666" }}>Loading risk assessment...</div>
      </div>
    );
  }

  // Determine risk color and recommendations based on level
  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case "HIGH":
        return {
          color: "#d32f2f",
          backgroundColor: "#ffebee",
          borderColor: "#ef5350",
          icon: "⚠️"
        };
      case "MODERATE":
        return {
          color: "#f57c00",
          backgroundColor: "#fff3e0",
          borderColor: "#ff9800",
          icon: "⚡"
        };
      case "LOW":
        return {
          color: "#388e3c",
          backgroundColor: "#e8f5e9",
          borderColor: "#66bb6a",
          icon: "✓"
        };
      default:
        return {
          color: "#666",
          backgroundColor: "#f5f5f5",
          borderColor: "#ddd",
          icon: "•"
        };
    }
  };

  const style = getRiskStyle(summary.risk);

  // Generate personalized intervention recommendations
  const getRecommendations = () => {
    const recommendations = [];

    if (summary.risk === "HIGH") {
      recommendations.push("Immediate care coordination required");
      recommendations.push("Weekly follow-up with primary care provider");
      recommendations.push("Consider enrollment in case management program");
      recommendations.push("Daily medication adherence monitoring");
    } else if (summary.risk === "MODERATE") {
      recommendations.push("Schedule primary care follow-up within 7 days");
      recommendations.push("Review medication regimen with pharmacist");
      recommendations.push("Consider telehealth check-ins");
      recommendations.push("Patient education on warning signs");
    } else {
      recommendations.push("Continue regular primary care visits");
      recommendations.push("Maintain medication adherence");
      recommendations.push("Use patient portal for non-urgent concerns");
    }

    // Add condition-specific recommendations
    if (summary.conditions.some(c => /diabetes|diabetic/i.test(c))) {
      recommendations.push("Monitor blood glucose daily");
      recommendations.push("Nutrition counseling recommended");
    }

    if (summary.conditions.some(c => /heart|cardiac|hypertension/i.test(c))) {
      recommendations.push("Monitor blood pressure daily");
      recommendations.push("Cardiac rehabilitation referral");
    }

    if (summary.conditions.some(c => /copd|asthma|respiratory/i.test(c))) {
      recommendations.push("Ensure inhaler technique is correct");
      recommendations.push("Pulmonary rehabilitation referral");
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div style={{
      border: `2px solid ${style.borderColor}`,
      padding: 16,
      borderRadius: 8,
      margin: "12px 0",
      backgroundColor: style.backgroundColor
    }}>
      {/* Risk Level Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 12,
        fontSize: 18,
        fontWeight: "bold",
        color: style.color
      }}>
        <span style={{ fontSize: 24, marginRight: 8 }}>{style.icon}</span>
        <span>Risk Level: {summary.risk}</span>
      </div>

      {/* Risk Factors Summary */}
      <div style={{
        backgroundColor: "white",
        padding: 12,
        borderRadius: 6,
        marginBottom: 12
      }}>
        <div style={{ marginBottom: 8 }}>
          <b>ED Visits (Last 12 months):</b>{" "}
          <span style={{
            fontWeight: "bold",
            color: summary.edCount12m >= 4 ? style.color : "#333"
          }}>
            {summary.edCount12m}
          </span>
          {summary.edCount12m >= 8 && (
            <span style={{
              marginLeft: 8,
              fontSize: 12,
              color: "#d32f2f",
              fontStyle: "italic"
            }}>
              (Frequent user - immediate intervention needed)
            </span>
          )}
        </div>

        {/* Chronic Conditions */}
        {summary.conditions.length > 0 && (
          <div>
            <b>Active Conditions:</b>
            <ul style={{
              margin: "4px 0 0 20px",
              padding: 0,
              listStyleType: "disc"
            }}>
              {summary.conditions.map((condition, idx) => (
                <li key={idx} style={{ marginBottom: 2 }}>
                  {condition}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Intervention Recommendations */}
      <div style={{
        backgroundColor: "white",
        padding: 12,
        borderRadius: 6
      }}>
        <b style={{ color: style.color }}>
          Recommended Interventions:
        </b>
        <ul style={{
          margin: "8px 0 0 20px",
          padding: 0,
          listStyleType: "none"
        }}>
          {recommendations.map((rec, idx) => (
            <li key={idx} style={{
              marginBottom: 6,
              paddingLeft: 20,
              position: "relative"
            }}>
              <span style={{
                position: "absolute",
                left: 0,
                color: style.color
              }}>
                →
              </span>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* Alert Message for High Risk */}
      {summary.risk === "HIGH" && (
        <div style={{
          marginTop: 12,
          padding: 10,
          backgroundColor: "#fff5f5",
          border: "1px solid #ffcdd2",
          borderRadius: 4,
          fontSize: 14
        }}>
          <strong style={{ color: "#d32f2f" }}>
            ⚠️ High Risk Alert:
          </strong>{" "}
          This patient requires immediate care coordination to prevent readmission.
          Please initiate comprehensive intervention protocol within 24 hours.
        </div>
      )}

      {/* Educational Note */}
      <div style={{
        marginTop: 12,
        fontSize: 12,
        color: "#666",
        fontStyle: "italic"
      }}>
        * Risk assessment based on ED utilization patterns, chronic conditions,
        and medication complexity. Updated with each encounter.
      </div>
    </div>
  );
};

export default RiskFlags;