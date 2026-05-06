type AppIconProps = {
  className?: string;
};

function AppIcon({ className = "" }: AppIconProps) {
  return (
    <span className={`app-icon ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <defs>
          <linearGradient id="appIconAccent" x1="18" y1="12" x2="48" y2="54">
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="#ffffff" />
        <rect x="17" y="9" width="30" height="46" rx="9" fill="#f8fbfd" stroke="url(#appIconAccent)" strokeWidth="3" />
        <path d="M17 28h30" stroke="#dbe7ee" strokeWidth="2" />
        <path d="M39 16v8M39 35v8" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
        <path d="M24 19h8M24 23h7" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="28" cy="41" r="5.5" fill="#ef4444" />
        <path d="M28 35.5c.4-2.4 1.7-3.7 3.9-4.3" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        <path d="M24.8 35.2c1.4-.5 2.6 0 3.4 1.1" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 56h22" stroke="#0f172a" strokeOpacity=".12" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default AppIcon;
