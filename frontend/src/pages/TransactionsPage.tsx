import React, { useEffect, useState } from 'react';
import { ListFilter, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { LiveRiskEvent } from '../types';

export const TransactionsPage: React.FC = () => {
  const [events, setEvents] = useState<LiveRiskEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getRiskHistory(50, 'TRANSACTION');
      setEvents(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filtered = events.filter((e) => {
    const matchesSearch =
      searchTerm === '' ||
      (e.recipient_masked && e.recipient_masked.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.explanation && e.explanation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLevel = filterLevel === 'ALL' || e.risk_level === filterLevel;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ListFilter className="w-6 h-6 text-indigo-400" />
            <span>Transaction Logs & Risk Audits</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete historical audit trail of all simulated UPI payment requests and computed fraud scores.
          </p>
        </div>
        <button
          onClick={loadTransactions}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by recipient or reason..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Risk Filter:</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">ALL LEVELS</option>
            <option value="LOW">LOW ONLY</option>
            <option value="MEDIUM">MEDIUM ONLY</option>
            <option value="HIGH">HIGH ONLY</option>
            <option value="CRITICAL">CRITICAL ONLY</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Event ID / Hash</th>
                <th className="py-3 px-4">Recipient (Masked)</th>
                <th className="py-3 px-4">Risk Evaluation</th>
                <th className="py-3 px-4">Summary & Explanations</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No transactions match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {item.id ? item.id.slice(0, 8) : 'tx-mock'}...
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {item.recipient_masked || 'rah***@upi'}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={item.risk_level} score={item.risk_score} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-md truncate text-xs">
                      {item.explanation || 'Evaluated against baseline'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Recent'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
