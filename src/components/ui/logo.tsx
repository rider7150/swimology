export function Logo({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Wave background */}
      <path
        d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
        fill="url(#gradient)"
      />
      
      {/* Swimmer silhouette - freestyle swimming position */}
      <path
        d="M12 20C12 20 16 17 20 17C24 17 28 20 28 20"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 16C15 16 18 14 20 14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="22" cy="13" r="3" fill="white" />
      
      {/* Water ripples - more dynamic */}
      <path
        d="M10 23C10 23 14 21 18 21C22 21 26 23 26 23"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M14 26C14 26 18 24 22 24C26 24 30 26 30 26"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Gradient definition - keeping the professional blue */}
      <defs>
        <linearGradient
          id="gradient"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
} 