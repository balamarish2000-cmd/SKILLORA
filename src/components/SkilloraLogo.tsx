import React from 'react';

interface SkilloraLogoProps {
  className?: string;
  showWordmark?: boolean;
  subtitle?: string;
}

export const SkilloraLogo: React.FC<SkilloraLogoProps> = ({
  className = '',
  showWordmark = true,
  subtitle,
}) => {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="8"
          fill="#EFF6FF"
          stroke="#2563EB"
          strokeWidth="1.75"
        />
        <path
          d="M9.5 21.5L15 11.5L19.5 16.5L23.5 10"
          stroke="#2563EB"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="23.5" cy="10" r="2.25" fill="#1D4ED8" />
        <circle cx="9.5" cy="21.5" r="2" fill="#2563EB" />
      </svg>
      {showWordmark && (
        <span className="flex flex-col leading-none text-left">
          <span className="font-display text-lg font-extrabold tracking-tight text-[#172B4D]">
            SKILLORA
          </span>
          {subtitle && (
            <span className="text-[10px] font-medium tracking-wide text-[#64748B] mt-0.5">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
};
