"use client";

export default function NeuroVaultLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon outline */}
      <path
        d="M20 2L35.5 11V29L20 38L4.5 29V11L20 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Brain/neural network icon inside */}
      <g stroke="currentColor" strokeWidth="1.5" fill="none">
        {/* Center node */}
        <circle cx="20" cy="20" r="3" />
        {/* Top connection */}
        <circle cx="20" cy="12" r="2" />
        <line x1="20" y1="17" x2="20" y2="14" />
        {/* Bottom left */}
        <circle cx="14" cy="25" r="2" />
        <line x1="18" y1="21" x2="15.5" y2="23.5" />
        {/* Bottom right */}
        <circle cx="26" cy="25" r="2" />
        <line x1="22" y1="21" x2="24.5" y2="23.5" />
        {/* Left */}
        <circle cx="12" cy="17" r="2" />
        <line x1="17" y1="19" x2="14" y2="18" />
        {/* Right */}
        <circle cx="28" cy="17" r="2" />
        <line x1="23" y1="19" x2="26" y2="18" />
      </g>
    </svg>
  );
}
