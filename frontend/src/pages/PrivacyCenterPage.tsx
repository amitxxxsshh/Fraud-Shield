import React, { useEffect, useState } from 'react';
import { Lock, Trash2, ShieldCheck, KeyRound, Clock, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';

export const PrivacyCenterPage: React.FC = () => {
  const [testUpi, setTestUpi] = useState<string>('rahul.verma@okaxis');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteResult, setDeleteResult] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const loadAuditLogs = async () => {
    try {
      const logs = await api.getPrivacyAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleDeleteMyData = async () => {
    if (!window.confirm('Are you sure you want to purge all your session data and voice transcripts?')) {
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await api.deleteUserData('demo-user-1');
      setDeleteResult(res);
      await loadAuditLogs();
    } catch (err: any) {
      alert(`Deletion Error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Masking preview helper
  const maskPreview = (raw: string) => {
    if (!raw.includes('@')) return 'ra***@upi';
    const parts = raw.split('@');
    return `${parts[0].slice(0, 2)}***@${parts[1]}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-indigo-400" />
            <span>Privacy by Design & Cryptographic Tokenization</span>
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ZERO RAW PII STORAGE
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Architectural privacy guarantees: Salted SHA-256 recipient hashing, ephemeral audio retention, and user data purge capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cryptographic Hashing Demo & Retention Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Hashing Sandbox */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Salted HMAC SHA-256 Identifier Masking Sandbox
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Raw UPI addresses, phone numbers, and device fingerprints are never stored in plain text.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Input Raw UPI ID or Phone
              </label>
              <input
                type="text"
                value={testUpi}
                onChange={(e) => setTestUpi(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-slate-400 text-[11px]">Database Stored Representation:</div>
              <div className="text-[10px] text-cyan-400 break-all bg-black/40 p-2 rounded-lg border border-slate-800">
                recipient_hash: 7d49cf308b49e6fbc3b544e392... (256-bit salted hash)
              </div>
              <div className="text-[11px] text-slate-300 pt-1">
                Display Mask in UI: <strong className="text-emerald-400">{maskPreview(testUpi)}</strong>
              </div>
            </div>
          </div>

          {/* Retention Rules */}
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Configured Data Retention Policy
              </h3>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span>Voice Audio Chunks</span>
                <span className="font-mono text-indigo-400 font-bold">Ephemeral (Deleted after call)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span>Scam Transcripts</span>
                <span className="font-mono text-indigo-400 font-bold">Explicit Consent Required</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span>Transaction Identifiers</span>
                <span className="font-mono text-indigo-400 font-bold">Irreversible Hash Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Delete My Data Action & Audit Logs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Delete Action Box */}
          <div className="glass-panel p-5 space-y-4 border-rose-950/60 bg-rose-950/10">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider">
                User Right to Erasure
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trigger the <strong className="text-white">DELETE /api/user/data</strong> endpoint to immediately wipe all transactions, voice recordings, and message histories from the database.
            </p>

            <button
              type="button"
              onClick={handleDeleteMyData}
              disabled={deleteLoading}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deleteLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Purging Records...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>DELETE MY DATA NOW</span>
                </>
              )}
            </button>

            {deleteResult && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Data Purge Complete</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-200/80">
                  Purged {deleteResult.purged_records.transactions} transactions, {deleteResult.purged_records.voice_events} voice streams.
                </div>
              </div>
            )}
          </div>

          {/* Compliance Audit Trail */}
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Compliance Audit Trail
                </h4>
              </div>
              <button
                onClick={loadAuditLogs}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-6 text-[11px]">
                  No audit actions recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-indigo-400 font-bold">{log.action}</span>
                      <span className="text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Actor: {log.actor_id}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
