import React from "react";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH";
export interface RiskSummary { edCount12m: number; risk: RiskLevel; conditions: string[]; }

const RiskFlags: React.FC<{ summary?: RiskSummary }> = ({ summary }) => {
  if (!summary) return null;
  const color = summary.risk === "HIGH" ? "#c0392b" : summary.risk === "MODERATE" ? "#f39c12" : "#27ae60";
  return (
    <div style={{ border: `2px solid ${color}`, padding: 12, borderRadius: 8, margin: "8px 0" }}>
      <b>Risk Summary</b>
      <div>ED visits (12 months): {summary.edCount12m}</div>
      <div>Risk level: {summary.risk}</div>
      {summary.conditions.length > 0 && <div>Chronic conditions: {summary.conditions.join(", ")}</div>}
    </div>
  );
};
export default RiskFlags;