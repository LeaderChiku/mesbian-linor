'use client';

interface WaxSealProps {
  initials?: string;
  size?: number;
  color?: 'blush' | 'pistachio' | 'neutral';
  className?: string;
}

export default function WaxSeal({
  initials = 'M&L',
  size = 54,
  color = 'blush',
  className = '',
}: WaxSealProps) {
  const colors = {
    blush: {
      fill:   '#d4848a',
      border: '#b85f66',
      shadow: 'rgba(184,95,102,0.3)',
      text:   '#fce8e9',
    },
    pistachio: {
      fill:   '#73924f',
      border: '#5a733d',
      shadow: 'rgba(90,115,61,0.3)',
      text:   '#f5f8ee',
    },
    neutral: {
      fill:   '#a09080',
      border: '#8a796a',
      shadow: 'rgba(138,121,106,0.3)',
      text:   '#f9f6ef',
    },
  }[color];

  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0 3px 6px ${colors.shadow})` }}
      >
        {/* Irregular organic wax perimeter */}
        <path
          d="M30 4 C44 2, 54 12, 56 26 C58 40, 48 54, 32 57 C16 60, 4 48, 3 32 C2 16, 16 6, 30 4 Z"
          fill={colors.fill}
        />
        {/* Inner pressed rim */}
        <circle
          cx="30"
          cy="30"
          r="21"
          fill="none"
          stroke={colors.border}
          strokeWidth="1.5"
          opacity="0.8"
        />
        {/* Inner dotted decorative ring */}
        <circle
          cx="30"
          cy="30"
          r="18"
          fill="none"
          stroke={colors.text}
          strokeWidth="0.8"
          strokeDasharray="2 3"
          opacity="0.6"
        />
        {/* Monogram / Motif */}
        <text
          x="30"
          y="34"
          textAnchor="middle"
          fill={colors.text}
          fontSize="13"
          fontFamily="var(--font-playfair), Georgia, serif"
          fontWeight="bold"
          letterSpacing="1"
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}
