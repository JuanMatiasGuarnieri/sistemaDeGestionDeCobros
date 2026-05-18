export function Logo({ className = '', size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <svg
      className={`${sizes[size]} ${className}`}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill="url(#gradient)" />
      <path
        d="M18 20h28v4H18zM18 30h28v4H18zM18 40h20v4H18z"
        fill="white"
        opacity="0.95"
      />
      <circle cx="48" cy="46" r="10" fill="#10b981" />
      <path
        d="M44 46l3 3 5-6"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoHorizontal({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size="lg" />
      <div>
        <h1 className="text-lg font-bold text-gray-800 leading-tight">Sistema de Gestión</h1>
        <p className="text-xs text-gray-500">Facturación y Cobranzas</p>
      </div>
    </div>
  );
}