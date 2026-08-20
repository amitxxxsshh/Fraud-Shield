import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export const SecurityNotice: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-center justify-between gap-3 shadow-inner">
      <div className="flex items-center gap-2.5">
        <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
          <Info className="w-4 h-4" />
        </span>
        <span>
          <strong className="text-slate-200">Hackathon Prototype:</strong> Controlled Payment Simulator with Twilio Programmable Voice & AI Explainability. No real bank accounts or credentials are ever accessed.
        </span>
      </div>
      <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        PRIVACY HASHING ACTIVE (SHA-256)
      </div>
    </div>
  );
};
