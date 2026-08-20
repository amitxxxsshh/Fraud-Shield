import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  iconOnly = false,
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Shield + Digital Cyber Security Icon */}
      <div
        className={`relative flex items-center justify-center ${iconDimensions[size]} rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 p-0.5 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/40`}
      >
        <div className="w-full h-full bg-slate-950/70 rounded-[10px] backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
          {/* Subtle Cyber Grid / Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.35),transparent_70%)]" />
          
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-3/5 h-3/5 relative z-10 text-white drop-shadow-[0_2px_8px_rgba(6,182,212,0.6)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Protective Shield Geometry */}
            <path
              d="M12 2L4 5.5V11.5C4 16.8 7.4 21.7 12 23C16.6 21.7 20 16.8 20 11.5V5.5L12 2Z"
              stroke="url(#brandGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Cyber Keyhole & Pulse Node */}
            <path
              d="M12 7V11M12 15V17"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="13" r="2" fill="#06b6d4" />
            <path
              d="M8.5 10.5L10 12M15.5 10.5L14 12"
              stroke="#818cf8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="brandGrad" x1="4" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a5b4fc" />
                <stop offset="0.5" stopColor="#38bdf8" />
                <stop offset="1" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Typography Brand Name */}
      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className={`${titleSizes[size]} font-black tracking-tight text-white`}>
              FRAUD
            </span>
            <span
              className={`${titleSizes[size]} font-black tracking-tight bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent`}
            >
              SHIELD
            </span>
            <span className="hidden sm:inline-flex text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30 uppercase tracking-wider">
              ENTERPRISE
            </span>
          </div>
          {showSubtitle && (
            <p className={`${subtitleSizes[size]} text-slate-400 font-medium tracking-wide leading-none mt-0.5`}>
              Real-Time Phishing & Payment Defense
            </p>
          )}
        </div>
      )}
    </div>
  );
};
