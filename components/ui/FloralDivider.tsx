'use client';

/** Decorative SVG floral divider */
export default function FloralDivider({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center gap-3 text-pistachio-300 ${className}`}
    >
      {/* Left line */}
      <span className="h-px flex-1 bg-pistachio-200 max-w-[60px]" />

      {/* Flower SVG */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Petals */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="14"
            cy="14"
            rx="4"
            ry="7"
            fill="#cfe0aa"
            transform={`rotate(${deg} 14 14)`}
          />
        ))}
        {/* Centre */}
        <circle cx="14" cy="14" r="3.5" fill="#e8b4b8" />
      </svg>

      {/* Leaf left */}
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
        <path
          d="M1 11 C4 1, 14 1, 17 6 C14 4, 4 5, 1 11Z"
          fill="#afc97a"
        />
      </svg>

      {/* Right line */}
      <span className="h-px flex-1 bg-pistachio-200 max-w-[60px]" />
    </div>
  );
}
