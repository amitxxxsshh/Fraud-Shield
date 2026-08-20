import React, { useState } from 'react';
import {
  PhoneCall, Radio, Mic, Upload, Play, CheckCircle2,
  AlertOctagon, ShieldAlert, Sparkles, Volume2, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { VoiceAnalysisResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskMeter } from '../components/RiskMeter';

export const VoiceAnalyzerPage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('bank_scam');
  const [transcript, setTranscript] = useState<string>(
    'I am calling from your bank security division. Your account has been compromised. ' +
    'You need to transfer 25000 rupees immediately to verify and secure your account. ' +
    'Please give me the OTP sent to your phone to proceed.'
  );
  const [callerPhone, setCallerPhone] = useState<string>('+91 98765 43210');
  const [consentGiven, setConsentGiven] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<VoiceAnalysisResponse | null>(null);

  const presets: Record<string, { title: string; text: string; tag: string }> = {
    bank_scam: {
      title: 'Bank Security Impersonation + OTP Demanded',
      text:
        'I am calling from your bank security division. Your account has been compromised. ' +
        'You need to transfer 25000 rupees immediately to verify and secure your account. ' +
        'Please give me the OTP sent to your phone to proceed.',
      tag: 'CRITICAL VISHING',
    },
    police_arrest: {
      title: 'Digital Arrest / Fake Police Department Threat',
      text:
        'This is Senior Inspector Sharma from Cyber Crime Department. An arrest warrant has been issued ' +
        'under your name for illegal transactions. Do not disconnect this call and transfer 50000 rupees for security deposit.',
      tag: 'DIGITAL ARREST',
    },
    refund_scam: {
      title: 'UPI Accidental Refund / Reversal Lure',
      text:
        'Hello sir, this is payment support. An accidental refund of 4500 rupees has been sent to your account. ' +
        'Open your UPI app and click approve payment request to reverse.',
      tag: 'REFUND LURE',
    },
    kyc_scam: {
      title: 'KYC Expiry & QuickSupport Screen Share',
      text:
        'Your bank KYC has expired. Download QuickSupport or AnyDesk app right now so our agent can remotely ' +
        'verify your Aadhaar and enter your UPI PIN.',
      tag: 'REMOTE APP / KYC',
    },
    normal_call: {
      title: 'Normal Friendly Conversation (Harmless)',
      text:
        'Hey Rahul, are you coming to the office today? Let us catch up for lunch around 1 PM near the cafe.',
      tag: 'NORMAL',
    },
  };

  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    setTranscript(presets[key].text);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await api.evaluateVoice({
        transcript: transcript.trim(),
        caller_phone: callerPhone.trim(),
        consent_given: consentGiven,
      });
      setAnalysis(res);
    } catch (err: any) {
      alert(`Voice Analysis Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <PhoneCall className="w-6 h-6 text-cyan-400" />
              <span>Voice Phishing (Vishing) & Social Engineering Studio</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              TWILIO + STT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time acoustic & semantic classification of incoming voice streams, impersonation signatures, and OTP harvesting patterns.
          </p>
        </div>
      </div>

      {/* Twilio Webhook Live Integration Card */}
      <div className="glass-panel p-4 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border-indigo-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <span className="font-bold text-white">Twilio Programmable Voice Webhook:</span>
              <span className="font-mono text-slate-300 ml-1.5">POST /twilio/voice/incoming</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Media Stream:</span>
            <span className="text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
              wss://[BACKEND_HOST]/twilio/media-stream
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input & Preset Selector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
                Voice Scenario Presets
              </h2>
              <span className="text-[11px] text-slate-500">Select preset or type custom text</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(presets).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedPreset === key
                      ? 'bg-cyan-950/30 border-cyan-500/60 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    {p.tag}
                  </span>
                  <div className="text-xs font-bold mt-1 text-slate-200">{p.title}</div>
                </button>
              ))}
            </div>

            {/* Transcript Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Call Speech Transcript (STT Output / Buffer)</span>
                <span className="text-[10px] text-slate-500 font-mono">Whisper Compatible</span>
              </label>
              <textarea
                rows={4}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Enter or stream spoken conversation..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Disclosure & Consent Policy */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300 text-[11px]">
                  Audio Recording & Real-time Analysis Disclosure Policy
                </span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-emerald-400 cursor-pointer font-mono">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                />
                Consent Confirmed
              </label>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !transcript.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Running Acoustic & Semantic Classifier...</span>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Analyze Spoken Conversation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Classifier Results */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 space-y-4 min-h-[420px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Social Engineering Classifier Output
                </h3>
                {analysis && (
                  <RiskBadge level={analysis.risk_level} score={analysis.risk_score} size="sm" />
                )}
              </div>

              {!analysis ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  Click <strong className="text-cyan-400">Analyze Spoken Conversation</strong> to classify social engineering vectors.
                </div>
              ) : (
                <div className="space-y-4 mt-4 animate-in fade-in duration-200">
                  {/* Gauge */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500">
                        Voice Phishing Risk
                      </span>
                      <div className="mt-1">
                        <RiskBadge level={analysis.risk_level} score={analysis.risk_score} size="md" />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-2">
                        Confidence: <strong className="text-cyan-400">{Math.round(analysis.confidence * 100)}%</strong>
                      </div>
                    </div>
                    <RiskMeter score={analysis.risk_score} level={analysis.risk_level} size={90} />
                  </div>

                  {/* Detected Patterns */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block mb-1.5 font-mono uppercase">
                      Detected Attack Vectors:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.detected_patterns.length === 0 ? (
                        <span className="text-xs text-slate-500">No malicious patterns detected.</span>
                      ) : (
                        analysis.detected_patterns.map((pat, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30"
                          >
                            ⚠️ {pat.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-indigo-300 block mb-0.5 font-mono text-[10px]">
                      CLASSIFIER SUMMARY:
                    </strong>
                    {analysis.explanation}
                  </div>
                </div>
              )}
            </div>

            {/* Acoustic Waveform Simulation Animation */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Stream Buffer 8kHz mulaw</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-cyan-500/60 rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-cyan-400 rounded-full animate-pulse" />
                <span className="w-1 h-2 bg-cyan-500/40 rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
