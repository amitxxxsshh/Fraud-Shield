import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = 'md',
  showScore = true,
}) => {
  const normLevel = (level || 'LOW').toUpperCase();

  const config = {
    LOW: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: ShieldCheck,
      dot: 'bg-emerald-500',
      label: 'LOW RISK',
    },
    MEDIUM: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: AlertTriangle,
      dot: 'bg-amber-500',
      label: 'MEDIUM RISK',
    },
    HIGH: {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      icon: AlertTriangle,
      dot: 'bg-orange-500',
      label: 'HIGH RISK',
    },
    CRITICAL: {
      bg: 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse-slow',
      icon: AlertOctagon,
      dot: 'bg-red-500 shadow-lg shadow-red-500/50',
      label: 'CRITICAL RISK',
    },
  }[normLevel] || {
    bg: 'bg-slate-700/20 text-slate-400 border-slate-700',
    icon: Info,
    dot: 'bg-slate-400',
    label: normLevel,
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses} font-mono uppercase tracking-wider`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <IconComponent className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 rounded bg-black/40 text-white font-mono font-bold">
          {score}/100
        </span>
      )}
    </span>
  );
};
