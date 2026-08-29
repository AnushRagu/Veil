import React from "react";

export const ToggleCard: React.FC<{
  active: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
  disabled?: boolean;
}> = ({ active, onToggle, icon, title, hint, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    onClick={() => !disabled && onToggle()}
    className={`toggle ${active ? "toggle--on" : ""}`}
    disabled={disabled}
  >
    <span className="toggle__icon">{icon}</span>
    <span className="toggle__label">
      <span className="toggle__title">{title}</span>
      <span className="toggle__hint">{hint}</span>
    </span>
  </button>
);
