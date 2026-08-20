import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertOctagon, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { FeedbackEntry } from '../types';

export const FeedbackPage: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const data = await api.getFeedbackList(50);
      setFeedbackList(data);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const totalFeedback = feedbackList.length;
  const falsePositives = feedbackList.filter((f) => f.actual_feedback === 'FALSE_POSITIVE').length;
  const confirmedFraud = feedbackList.filter((f) => f.actual_feedback === 'CONFIRMED_FRAUD').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>False Positive & Threat Confirmation Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track user feedback telemetry on risk predictions for model precision calibration without naive automatic retraining.
          </p>
        </div>
        <button
          onClick={loadFeedback}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Total User Reports</span>
          <div className="text-3xl font-black font-mono text-white mt-2">{totalFeedback}</div>
          <p className="text-[10px] text-slate-500 mt-1">Telemetry responses received</p>
        </div>

        <div className="glass-panel p-5 border-red-950/60 bg-red-950/10">
          <span className="text-xs font-semibold text-red-400">Confirmed Fraud</span>
          <div className="text-3xl font-black font-mono text-red-400 mt-2">{confirmedFraud}</div>
          <p className="text-[10px] text-red-300/60 mt-1">Confirmed threats caught by shield</p>
        </div>

        <div className="glass-panel p-5 border-emerald-950/60 bg-emerald-950/10">
          <span className="text-xs font-semibold text-emerald-400">False Positives</span>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-2">{falsePositives}</div>
          <p className="text-[10px] text-emerald-300/60 mt-1">Safe transactions reported by users</p>
        </div>
      </div>

      {/* Feedback Logs Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            User Feedback Audit Log
          </h3>
          <span className="text-[11px] font-mono text-slate-500">Model: v1.0-xgb-upi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Feedback ID</th>
                <th className="py-3 px-4">User Verdict</th>
                <th className="py-3 px-4">Predicted Risk</th>
                <th className="py-3 px-4">User Notes</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {feedbackList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No feedback recorded yet. Submit feedback after running any payment in SecurePay simulator.
                  </td>
                </tr>
              ) : (
                feedbackList.map((f, idx) => (
                  <tr key={f.id || idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {f.id ? f.id.slice(0, 8) : 'fb-mock'}...
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                          f.actual_feedback === 'CONFIRMED_FRAUD'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {f.actual_feedback === 'CONFIRMED_FRAUD' ? 'CONFIRMED FRAUD' : 'FALSE POSITIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {f.prediction_risk_level} ({f.prediction_risk_score}/100)
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs max-w-sm truncate">
                      {f.user_comments || 'No user comments added'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {f.created_at ? new Date(f.created_at).toLocaleTimeString() : 'Recent'}
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
