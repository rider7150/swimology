export function Logo({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src="/images/swimology-logo.png"
      alt="Swimology Logo"
      width={size}
      height={size}
      className={className}
    />
  );
} 