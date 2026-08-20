import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ShieldAlert, ShieldCheck, PhoneCall, MessageSquare,
  AlertOctagon, CheckCircle2, TrendingUp, Radio, ArrowUpRight, Clock
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, DashboardCharts, LiveRiskEvent } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { SecurityNotice } from '../components/SecurityNotice';

interface DashboardPageProps {
  lastEvent: LiveRiskEvent | null;
}

const RISK_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ lastEvent }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [events, setEvents] = useState<LiveRiskEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [s, c, e] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardCharts(),
        api.getDashboardEvents(15),
      ]);
      setStats(s);
      setCharts(c);
      setEvents(e);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When live event arrives over WebSocket, prepend to feed and update stats
  useEffect(() => {
    if (lastEvent) {
      setEvents((prev) => [lastEvent, ...prev.slice(0, 14)]);
      // Refresh stats
      api.getDashboardStats().then(setStats).catch(() => {});
    }
  }, [lastEvent]);

  // Format Pie chart data
  const pieData = charts?.risk_distribution
    ? Object.entries(charts.risk_distribution).map(([name, value]) => ({
        name,
        value,
        color: RISK_COLORS[name] || '#64748b',
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Top Security Banner */}
      <SecurityNotice />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span>Executive Risk Command Center</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">
              LIVE MONITOR
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time hybrid risk scoring, multi-channel voice vishing correlation & anomaly detection.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Transactions */}
        <div className="glass-panel p-4 flex flex-col justify-between border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Total Txns</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-white">
              {stats?.total_transactions ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Assessed in simulator</div>
          </div>
        </div>

        {/* Critical Risk Alerts */}
        <div className="glass-panel p-4 flex flex-col justify-between border-red-950/60 bg-red-950/10 hover:border-red-500/30 transition-colors">
          <div className="flex items-center justify-between text-red-400 text-xs">
            <span className="font-semibold">Critical Risk</span>
            <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-red-400">
              {stats?.critical_risk_count ?? 0}
            </div>
            <div className="text-[10px] text-red-300/60 font-mono mt-0.5">Score 80-100 (Blocked/Cancel)</div>
          </div>
        </div>

        {/* High Risk Alerts */}
        <div className="glass-panel p-4 flex flex-col justify-between border-orange-950/60 bg-orange-950/10 hover:border-orange-500/30 transition-colors">
          <div className="flex items-center justify-between text-orange-400 text-xs">
            <span className="font-semibold">High Risk</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-orange-400">
              {stats?.high_risk_count ?? 0}
            </div>
            <div className="text-[10px] text-orange-300/60 font-mono mt-0.5">Score 60-79 (Warned)</div>
          </div>
        </div>

        {/* Voice Scam Events */}
        <div className="glass-panel p-4 flex flex-col justify-between border-cyan-950/60 bg-cyan-950/10 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-cyan-400 text-xs">
            <span className="font-semibold">Voice Vishing</span>
            <PhoneCall className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-cyan-400">
              {stats?.voice_scam_events ?? 0}
            </div>
            <div className="text-[10px] text-cyan-300/60 font-mono mt-0.5">Twilio & Demo Calls</div>
          </div>
        </div>

        {/* Message Scam Events */}
        <div className="glass-panel p-4 flex flex-col justify-between border-purple-950/60 bg-purple-950/10 hover:border-purple-500/30 transition-colors">
          <div className="flex items-center justify-between text-purple-400 text-xs">
            <span className="font-semibold">Scam Messages</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-purple-400">
              {stats?.message_scam_events ?? 0}
            </div>
            <div className="text-[10px] text-purple-300/60 font-mono mt-0.5">Phishing & Threats</div>
          </div>
        </div>

        {/* False Positive Rate */}
        <div className="glass-panel p-4 flex flex-col justify-between border-emerald-950/60 bg-emerald-950/10 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span className="font-semibold">FP Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-emerald-400">
              {stats?.false_positive_rate ?? 0}%
            </div>
            <div className="text-[10px] text-emerald-300/60 font-mono mt-0.5">
              {stats?.false_positives ?? 0} user reports
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="glass-panel p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Transaction Risk Score Timeline</span>
              </h2>
              <p className="text-[11px] text-slate-400">Historical sequence of evaluated payments and risk scores.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              REAL-TIME FEED
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.risk_over_time || []}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="risk_score"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#riskGradient)"
                  name="Risk Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution Pie */}
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Risk Level Distribution</h2>
            <p className="text-[11px] text-slate-400">Breakdown of transactions by risk category.</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(val) => (
                    <span className="text-xs text-slate-300 font-mono">{val}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Risk Factors */}
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Top Contributing Risk Factors</h2>
            <p className="text-[11px] text-slate-400">Most frequent heuristic & ML triggers across all evaluations.</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.top_risk_factors || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="factor" type="category" stroke="#94a3b8" fontSize={10} width={150} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Trigger Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voice Scam Categories */}
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Voice Scam Vector Classification</h2>
            <p className="text-[11px] text-slate-400">Detected social engineering categories from voice streams.</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.voice_scam_categories || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={9} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Real-Time Risk Event Stream Table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Real-Time Risk Stream & Context Correlation Feed</span>
            </h2>
            <p className="text-[11px] text-slate-400">Live incoming events dispatched across WebSockets.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
                <th className="py-2.5 px-3">Key Reasons / Signals</th>
                <th className="py-2.5 px-3">Details / Excerpt</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No risk events captured yet. Try running a scenario from the Demo Flows page.
                  </td>
                </tr>
              ) : (
                events.map((ev, idx) => (
                  <tr key={ev.id || idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <RiskBadge level={ev.risk_level} score={ev.risk_score} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                      {Array.isArray(ev.reasons)
                        ? ev.reasons
                            .map((r: any) => (typeof r === 'string' ? r : r.description || r.factor))
                            .join(', ')
                        : 'Analyzed'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-sm truncate text-[11px]">
                      {ev.explanation || (ev.amount ? `₹${ev.amount.toLocaleString()} to ${ev.recipient_masked}` : '-')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Just now'}
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
