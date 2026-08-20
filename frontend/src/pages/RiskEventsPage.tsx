import React, { useEffect, useState } from 'react';
import { Activity, Radio, PhoneCall, MessageSquare, CreditCard, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { LiveRiskEvent } from '../types';

export const RiskEventsPage: React.FC = () => {
  const [events, setEvents] = useState<LiveRiskEvent[]>([]);
  const [eventType, setEventType] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getRiskHistory(50, eventType === 'ALL' ? undefined : eventType);
      setEvents(data);
    } catch (err) {
      console.error('Error loading risk history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [eventType]);

  const getEventIcon = (type: string) => {
    if (type === 'VOICE_CALL') return <PhoneCall className="w-4 h-4 text-cyan-400" />;
    if (type === 'MESSAGE') return <MessageSquare className="w-4 h-4 text-purple-400" />;
    return <CreditCard className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>Correlated Multi-Modal Risk Stream</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated timeline correlating suspicious phone calls, phishing SMS messages, and UPI transaction attempts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            {['ALL', 'TRANSACTION', 'VOICE_CALL', 'MESSAGE'].map((type) => (
              <button
                key={type}
                onClick={() => setEventType(type)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                  eventType === type
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button
            onClick={loadEvents}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Events Timeline List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-500 text-xs">
            No risk events recorded in this category yet.
          </div>
        ) : (
          events.map((ev, idx) => (
            <div
              key={ev.id || idx}
              className="glass-panel p-4.5 border-slate-800 hover:border-slate-700 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {getEventIcon(ev.event_type)}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      {ev.event_type.replace('_', ' ')}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ID: {ev.id ? ev.id.slice(0, 8) : 'evt-mock'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <RiskBadge level={ev.risk_level} score={ev.risk_score} size="md" />
                  <span className="text-[11px] font-mono text-slate-400">
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Reasons & Explanation */}
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                <p className="leading-relaxed">{ev.explanation || 'Risk assessment completed.'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
