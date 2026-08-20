import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio, Activity, Sparkles, PhoneCall, Send, Lock } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  wsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ wsConnected }) => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo size="md" />
          </Link>
        </div>

        {/* Quick Demo Shortcuts */}
        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/scenarios"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Demo Flows</span>
          </Link>
          <Link
            to="/simulator"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/20 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>SecurePay Simulator</span>
          </Link>
          <Link
            to="/voice"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/20 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice Analyzer</span>
          </Link>
        </div>

        {/* Live Stream Status Beacon */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono border ${
              wsConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
              }`}
            />
            <span className="font-semibold">
              {wsConnected ? 'STREAM ACTIVE' : 'STREAM CONNECTING'}
            </span>
          </div>

          <Link
            to="/privacy"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            title="Privacy by Design Center"
          >
            <Lock className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
