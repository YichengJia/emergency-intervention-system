export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export interface RiskSummary {
  edCount12m: number;
  risk: RiskLevel;
  conditions: string[];
}