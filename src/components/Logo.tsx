import Link from "next/link";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="9" fill="url(#gba-mark)" />
      <defs>
        <linearGradient id="gba-mark" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="#3FAC1D" />
          <stop offset="1" stopColor="#029A3F" />
        </linearGradient>
      </defs>
      <path
        d="M8 20c3-6 6-1 9-9 1.6-4.3 4.5-4.4 7-3"
        stroke="#FDFDFB"
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="8" cy="20" r="2" fill="#FDFDFB" />
      <path d="M22.5 6.5 25 8l-4.5 4.5" stroke="#FDFDFB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center ${className}`}
      aria-label="Gbawia"
    >
      <img
        src="/gbawia-logo.png"
        alt="Gbawia — Shared Freight Network"
        className="h-9 w-auto md:h-10"
      />
    </Link>
  );
}