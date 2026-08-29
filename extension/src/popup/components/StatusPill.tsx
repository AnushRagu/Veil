import React from "react";

export type StatusTone = "ok" | "warn" | "danger" | "off";

export const StatusPill: React.FC<{
  tone: StatusTone;
  children: React.ReactNode;
}> = ({ tone, children }) => (
  <span className={`status status--${tone}`}>
    <span className="status__dot" />
    {children}
  </span>
);
