import React, { useState } from 'react';
import {
  Send, AlertOctagon, ShieldAlert, CheckCircle, XCircle,
  HelpCircle, ArrowRight, Lock, RefreshCw, Smartphone, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { TransactionRiskResponse, RiskLevel } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskMeter } from '../components/RiskMeter';

export const SecurePaySimulatorPage: React.FC = () => {
  const [recipient, setRecipient] = useState<string>('unknown@ybl');
  const [amount, setAmount] = useState<number>(25000);
  const [newRecipient, setNewRecipient] = useState<boolean>(true);
  const [recentVoiceRisk, setRecentVoiceRisk] = useState<number>(94);
  const [recentMessageRisk, setRecentMessageRisk] = useState<number>(0);
  const [userAvgAmount, setUserAvgAmount] = useState<number>(3000);

  const [loading, setLoading] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<TransactionRiskResponse | null>(null);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [completedStatus, setCompletedStatus] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Handle Pay button click
  const handlePayClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCompletedStatus(null);
    setFeedbackSuccess(null);

    try {
      const response = await api.evaluateTransaction({
        amount: Number(amount),
        recipient: recipient.trim(),
        new_recipient: newRecipient,
        user_average_amount: Number(userAvgAmount),
        transaction_frequency: 2,
        recent_voice_risk: Number(recentVoiceRisk),
        recent_message_risk: Number(recentMessageRisk),
        device_risk: 0,
      });

      setAssessment(response);

      if (response.risk_level === 'HIGH' || response.risk_level === 'CRITICAL') {
        setShowWarningModal(true);
      } else {
        // Low/Medium risk: proceed directly
        setCompletedStatus('COMPLETED');
      }
    } catch (err: any) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle user action in warning modal
  const handleResolveTransaction = async (action: 'PROCEEDED' | 'CANCELLED') => {
    if (!assessment) return;

    try {
      await api.executeTransaction(assessment.transaction_id, action);
      setShowWarningModal(false);
      setCompletedStatus(action === 'PROCEEDED' ? 'COMPLETED' : 'CANCELLED');
    } catch (err: any) {
      alert(`Error updating transaction: ${err.message}`);
    }
  };

  // Submit feedback
  const handleFeedback = async (type: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE') => {
    if (!assessment) return;
    try {
      await api.submitFeedback({
        actual_feedback: type,
        transaction_id: assessment.transaction_id,
        prediction_risk_level: assessment.risk_level,
        prediction_risk_score: assessment.risk_score,
        user_comments: `Feedback from SecurePay demo screen for ${assessment.recipient_masked}`,
      });
      setFeedbackSuccess(
        type === 'CONFIRMED_FRAUD'
          ? 'Threat confirmed and logged to security telemetry.'
          : 'Marked as False Positive for model calibration.'
      );
    } catch (err: any) {
      alert(`Feedback Error: ${err.message}`);
    }
  };

  // Quick Scenario Fillers
  const fillScenario = (type: 'main_scam' | 'normal' | 'high_amount' | 'refund') => {
    setAssessment(null);
    setCompletedStatus(null);
    setFeedbackSuccess(null);

    if (type === 'main_scam') {
      setRecipient('unknown@ybl');
      setAmount(25000);
      setNewRecipient(true);
      setRecentVoiceRisk(94);
      setRecentMessageRisk(0);
      setUserAvgAmount(3000);
    } else if (type === 'normal') {
      setRecipient('rahul@upi');
      setAmount(500);
      setNewRecipient(false);
      setRecentVoiceRisk(0);
      setRecentMessageRisk(0);
      setUserAvgAmount(3000);
    } else if (type === 'high_amount') {
      setRecipient('vendor.sharma@okaxis');
      setAmount(50000);
      setNewRecipient(true);
      setRecentVoiceRisk(0);
      setRecentMessageRisk(0);
      setUserAvgAmount(3000);
    } else if (type === 'refund') {
      setRecipient('refund.support@paytm');
      setAmount(4500);
      setNewRecipient(true);
      setRecentVoiceRisk(78);
      setRecentMessageRisk(65);
      setUserAvgAmount(3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>SecurePay UPI Demo Simulator</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SANDBOX SIMULATOR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate payment attempts to test real-time multi-modal fraud detection and user warning modals.
          </p>
        </div>

        {/* Quick Scenario Pre-fills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fillScenario('main_scam')}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-colors"
          >
            Bank Scam Demo (₹25k)
          </button>
          <button
            type="button"
            onClick={() => fillScenario('normal')}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
          >
            Normal (₹500)
          </button>
          <button
            type="button"
            onClick={() => fillScenario('high_amount')}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-orange-600/20 text-orange-300 border border-orange-500/30 hover:bg-orange-600/30 transition-colors"
          >
            Large Anomaly (₹50k)
          </button>
        </div>
      </div>

      {/* Main Payment Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Mock Phone UPI Interface */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-slate-900 border-4 border-slate-800 shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            {/* Phone Top Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-800 rounded-b-xl flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* App Header */}
            <div className="mt-4 pt-3 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  ₹
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">SecurePay UPI</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Demo Protected</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                SHIELD ON
              </span>
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePayClick} className="my-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Recipient UPI ID / Virtual Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. rahul@upi"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="checkbox"
                    id="newRec"
                    checked={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="newRec" className="text-[11px] text-slate-400">
                    New / Unsaved Recipient
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Amount in Rupees (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-lg font-black font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Payment Method
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold">UPI Demo Account</span>
                  <span className="font-mono text-[10px] text-slate-500">•• 4819</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Risk...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>PAY ₹{amount.toLocaleString()}</span>
                  </>
                )}
              </button>
            </form>

            {/* Phone Footer Security Badge */}
            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-400" />
                End-to-End Hash Masking
              </span>
              <span>v1.0-xgb</span>
            </div>
          </div>
        </div>

        {/* Right Side: Simulation Parameters & Live Assessment Result */}
        <div className="lg:col-span-6 space-y-5">
          {/* Simulator Context Tweaker */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Live Multi-Modal Context Simulation Knobs
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 text-[11px]">Recent Voice Call Risk (0-100)</label>
                <input
                  type="number"
                  value={recentVoiceRisk}
                  onChange={(e) => setRecentVoiceRisk(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white"
                />
                <span className="text-[10px] text-slate-500">Set 90+ for Bank Scam call</span>
              </div>
              <div>
                <label className="text-slate-400 text-[11px]">Recent Message Risk (0-100)</label>
                <input
                  type="number"
                  value={recentMessageRisk}
                  onChange={(e) => setRecentMessageRisk(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white"
                />
                <span className="text-[10px] text-slate-500">Set 70+ for KYC/threat SMS</span>
              </div>
            </div>
          </div>

          {/* Result Card (When completed or evaluated) */}
          {completedStatus && (
            <div
              className={`glass-panel p-5 space-y-3 ${
                completedStatus === 'COMPLETED'
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex items-center gap-2">
                {completedStatus === 'COMPLETED' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="text-sm font-bold text-white">
                  Transaction {completedStatus === 'COMPLETED' ? 'Completed' : 'Cancelled by User'}
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Amount: <strong className="text-white">₹{amount.toLocaleString()}</strong> to{' '}
                <span className="font-mono text-slate-300">{assessment?.recipient_masked || recipient}</span>
              </p>

              {/* Feedback Loop Buttons */}
              <div className="pt-2 border-t border-slate-800/80">
                <p className="text-[11px] text-slate-400 mb-2">Help train the defense model:</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFeedback('CONFIRMED_FRAUD')}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-colors"
                  >
                    Report as Fraud
                  </button>
                  <button
                    onClick={() => handleFeedback('FALSE_POSITIVE')}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    False Positive
                  </button>
                </div>
                {feedbackSuccess && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-2">
                    ✓ {feedbackSuccess}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIGH / CRITICAL RISK EXPLAINABLE WARNING MODAL */}
      {/* ========================================================================= */}
      {showWarningModal && assessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-red-500/60 shadow-2xl shadow-red-950/80 p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <AlertOctagon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-red-400 uppercase font-mono">
                    🔴 CRITICAL PAYMENT RISK
                  </h2>
                  <p className="text-xs text-slate-400">
                    Fraud Shield intercepted a high-risk transfer attempt
                  </p>
                </div>
              </div>
            </div>

            {/* Score & Gauge Display */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-red-500/20">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 font-mono">
                  Composite Risk Level
                </span>
                <div className="mt-1">
                  <RiskBadge level={assessment.risk_level} score={assessment.risk_score} size="lg" />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Recipient: <span className="font-mono text-white">{assessment.recipient_masked}</span>
                  <br />
                  Amount: <strong className="text-white">₹{amount.toLocaleString()}</strong>
                </p>
              </div>
              <RiskMeter score={assessment.risk_score} level={assessment.risk_level} size={110} />
            </div>

            {/* Structured Reasons (Why are we warning you?) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Why are we warning you?
              </h3>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {assessment.reasons.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-start gap-2.5"
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                        r.impact === 'critical'
                          ? 'bg-red-500'
                          : r.impact === 'high'
                          ? 'bg-orange-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div className="space-y-0.5">
                      <p className="text-slate-200 font-medium">{r.description}</p>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        Factor: {r.factor} ({r.impact} impact)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Explanation Banner */}
            {assessment.explanation && (
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed">
                <strong className="text-indigo-300 block mb-0.5 font-mono text-[11px]">
                  EXPLAINABILITY SUMMARY:
                </strong>
                {assessment.explanation}
              </div>
            )}

            {/* Recommendation & Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-center text-xs font-bold font-mono text-red-400 mb-2">
                RECOMMENDED ACTION: CANCEL PAYMENT & VERIFY RECIPIENT
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleResolveTransaction('CANCELLED')}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>CANCEL PAYMENT</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveTransaction('PROCEEDED')}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700"
                >
                  I Understand — Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
