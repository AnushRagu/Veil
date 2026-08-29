import React from "react";

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

const base = (size = 16, strokeWidth = 1.75) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const ShieldIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 2 4 5v7c0 4.5 3.4 8.4 8 10 4.6-1.6 8-5.5 8-10V5l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ServerIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" />
    <circle cx="7" cy="7" r="0.6" fill="currentColor" />
    <circle cx="7" cy="17" r="0.6" fill="currentColor" />
    <path d="M11 7h6M11 17h6" />
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const SparkleIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

export const ChevronIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const AlertIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M10.3 3.7 2.3 18a1.9 1.9 0 0 0 1.7 2.8h16a1.9 1.9 0 0 0 1.7-2.8L13.7 3.7a1.9 1.9 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="m5 12 4 4 10-10" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v5h1" />
  </svg>
);

export const GaugeIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M12 14 8 9" />
    <path d="M3.5 18a9 9 0 1 1 17 0" />
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="m3 3 18 18" />
    <path d="M10.6 6.1A10 10 0 0 1 12 6c5 0 9 4 9.4 6a13 13 0 0 1-1.7 2.6" />
    <path d="M6.6 6.6A13 13 0 0 0 2.6 12C3 13.5 6 18 12 18a10 10 0 0 0 4.4-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

export const CrosshairIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const PulseIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M3 12h4l2-6 4 12 2-6h6" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8-.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export const MessageSquareIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const RefreshCwIcon: React.FC<IconProps> = ({ size, className, strokeWidth }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M21 12a9 9 0 1 1-9 9 9.75 9.75 0 0 1 6.74-2.74L21 16" />
  </svg>
);