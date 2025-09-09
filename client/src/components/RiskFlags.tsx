import React from "react";
import { RiskSummary } from "../types";

interface Props {
  summary?: RiskSummary;
}

const RiskFlags: React.FC<Props> = ({ summary }) => {
  if (!summary) return null;
  const color =
    summary.risk === "HIGH"
      ? "#c0392b"
      : summary.risk === "MODERATE"
      ? "#f39c12"
      : "#27ae60";
  return (
    <div
      style={{ border: `2px solid ${color}`, borderRadius: 8, padding: 12 }}
    >
      {/* Risk summary card */}
      <h3 style={{ marginTop: 0 }}>Risk Summary</h3>
      <p>
        <strong>ED visits (12 months):</strong> {summary.edCount12m}
      </p>
      <p>
        <strong>Risk level:</strong> {summary.risk}
      </p>
      {summary.conditions.length > 0 && (
        <p>
          <strong>Chronic conditions:</strong> {summary.conditions.join(", ")}
        </p>
      )}
    </div>
  );
};

export default RiskFlags;