import React from "react";

export const MetricCard: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
}> = ({ label, value, unit, accent }) => (
  <div className={`metric ${accent ? "metric--accent" : ""}`}>
    <div className="metric__label">{label}</div>
    <div className="metric__value">
      {value}
      {unit && <span className="metric__unit">{unit}</span>}
    </div>
  </div>
);
