import React, { useState } from 'react';
import {
  MessageSquare, ShieldAlert, Sparkles, CheckCircle2,
  AlertTriangle, Copy, Send, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { MessageRiskResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskMeter } from '../components/RiskMeter';

export const MessageAnalyzerPage: React.FC = () => {
  const [messageText, setMessageText] = useState<string>(
    'Your bank account will be blocked today. Pay ₹5000 immediately to update KYC.'
  );
  const [senderPhone, setSenderPhone] = useState<string>('+91 99887 76655');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MessageRiskResponse | null>(null);

  const sampleMessages = [
    {
      title: 'Urgent Bank Block Threat',
      text: 'Your bank account will be blocked today. Pay ₹5000 immediately to update KYC.',
    },
    {
      title: 'Electricity Power Disconnection',
      text: 'Dear consumer, your electricity power will be disconnected at 9:30 PM tonight due to previous month bill. Pay ₹3,200 immediately.',
    },
    {
      title: 'Fake Lottery / Reward Claim',
      text: 'Congratulations! You have won ₹25,00,000 in KBC Lucky Draw. To claim prize money, deposit processing fee of ₹12,500.',
    },
    {
      title: 'Normal Notification (Safe)',
      text: 'Your order has been delivered successfully. Thank you for shopping with us.',
    },
  ];

  const handleAnalyze = async () => {
    if (!messageText.trim()) return;
    setLoading(true);
    try {
      const res = await api.evaluateMessage(messageText.trim(), senderPhone.trim());
      setResult(res);
    } catch (err: any) {
      alert(`Message Analysis Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-purple-400" />
            <span>User-Provided SMS & Message Scam Analyzer</span>
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            USER-PROVIDED
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Paste any suspicious SMS, WhatsApp, or Telegram message to evaluate extortion, phishing links, and social engineering threats.
        </p>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
        <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          <strong className="text-slate-200">Privacy Notice:</strong> This feature analyzes user-provided text only. Fraud Shield never intercepts or monitors private messaging apps in the background.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 font-mono uppercase">
                  Paste Suspicious Message Text
                </label>
                <span className="text-[10px] text-slate-500">Quick Samples Below</span>
              </div>
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Paste SMS or WhatsApp text here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Quick Samples */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400">Sample Phishing Messages:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleMessages.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMessageText(s.text);
                      setResult(null);
                    }}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-left text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="font-semibold text-slate-200">{s.title}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{s.text}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !messageText.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Scanning Message...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Analyze Message Threat Level</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 space-y-4 min-h-[380px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Threat Evaluation
                </h3>
                {result && <RiskBadge level={result.risk_level} score={result.risk_score} size="sm" />}
              </div>

              {!result ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  Paste message and click <strong className="text-purple-400">Analyze Message</strong> to evaluate.
                </div>
              ) : (
                <div className="space-y-4 mt-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500">
                        Message Risk Score
                      </span>
                      <div className="mt-1">
                        <RiskBadge level={result.risk_level} score={result.risk_score} size="md" />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-2">
                        Sender Hash: <span className="text-slate-300">{result.sender_hash?.slice(0, 10)}...</span>
                      </div>
                    </div>
                    <RiskMeter score={result.risk_score} level={result.risk_level} size={85} />
                  </div>

                  {/* Patterns */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block mb-1.5 font-mono uppercase">
                      Detected Scam Patterns:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.detected_patterns.length === 0 ? (
                        <span className="text-xs text-slate-500">No malicious patterns detected.</span>
                      ) : (
                        result.detected_patterns.map((pat, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30"
                          >
                            ⚠️ {pat.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-purple-300 block mb-0.5 font-mono text-[10px]">
                      ANALYSIS SUMMARY:
                    </strong>
                    {result.explanation}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] font-mono text-slate-500 text-center pt-2 border-t border-slate-800/60">
              Evaluated via Heuristic Threat Filter & Keyword Correlation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
