import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Sparkles,
  PhoneCall,
  MessageSquare,
  ListFilter,
  Activity,
  CheckCircle2,
  Cpu,
  ShieldAlert,
  Lock,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Executive Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'SecurePay UPI Demo', path: '/simulator', icon: CreditCard, badge: 'DEMO' },
    { label: 'Interactive Demo Flows', path: '/scenarios', icon: Sparkles, highlight: true },
    { label: 'Voice Phishing Studio', path: '/voice', icon: PhoneCall },
    { label: 'Message Scam Analyzer', path: '/messages', icon: MessageSquare },
    { label: 'Transactions Log', path: '/transactions', icon: ListFilter },
    { label: 'Correlated Risk Events', path: '/risk-events', icon: Activity },
    { label: 'False Positive Feedback', path: '/feedback', icon: CheckCircle2 },
    { label: 'ML Model & ROC-AUC', path: '/model', icon: Cpu },
    { label: 'Privacy & Data Purge', path: '/privacy', icon: Lock },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
          Navigation & Controls
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 to-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-950/40'
                    : item.highlight
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span>Multi-Modal Guard</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500">
          Rule Heuristics + XGBoost (v1.0) + Multi-Channel Temporal Correlation.
        </p>
      </div>
    </aside>
  );
};
