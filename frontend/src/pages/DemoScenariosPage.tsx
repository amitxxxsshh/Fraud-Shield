import React, { useState } from 'react';
import {
  Sparkles, Play, CheckCircle2, AlertOctagon, PhoneCall,
  MessageSquare, ShieldCheck, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { RiskMeter } from '../components/RiskMeter';

export const DemoScenariosPage: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [stepLogs, setStepLogs] = useState<string[]>([]);
  const [resultData, setResultData] = useState<any>(null);

  const runScenario = async (scenarioId: string) => {
    setActiveScenario(scenarioId);
    setRunning(true);
    setStepLogs([]);
    setResultData(null);

    const log = (msg: string) => setStepLogs((prev) => [...prev, msg]);

    try {
      if (scenarioId === 'scenario_1_normal') {
        log('Step 1: Initiating standard ₹500 payment to known friend (rahul@upi)...');
        await new Promise((r) => setTimeout(r, 600));

        log('Step 2: Checking historical transaction baseline (User avg: ₹3,000)...');
        await new Promise((r) => setTimeout(r, 600));

        const res = await api.evaluateTransaction({
          amount: 500,
          recipient: 'rahul@upi',
          new_recipient: false,
          user_average_amount: 3000,
          recent_voice_risk: 0,
          recent_message_risk: 0,
        });

        log(`Step 3: Risk Engine evaluated composite score: ${res.risk_score}/100 (${res.risk_level})`);
        log(`Step 4: Status: ${res.recommended_action}. Transaction completed smoothly.`);
        setResultData(res);

      } else if (scenarioId === 'scenario_2_large_amount') {
        log('Step 1: User enters ₹50,000 payment to brand new recipient (vendor.fresh@okaxis)...');
        await new Promise((r) => setTimeout(r, 600));

        log('Step 2: Anomaly detection triggers: Amount is 16.6x above user average (₹3,000)...');
        await new Promise((r) => setTimeout(r, 600));

        const res = await api.evaluateTransaction({
          amount: 50000,
          recipient: 'vendor.fresh@okaxis',
          new_recipient: true,
          user_average_amount: 3000,
          recent_voice_risk: 0,
          recent_message_risk: 0,
        });

        log(`Step 3: Risk Engine computed score: ${res.risk_score}/100 (${res.risk_level})`);
        log(`Step 4: Action recommended: ${res.recommended_action}. High-risk modal presented.`);
        setResultData(res);

      } else if (scenarioId === 'scenario_3_main_bank_scam') {
        log('🎙️ STEP 1: Incoming Twilio call received. Caller: "I am from your bank security division. Account is compromised. Transfer 25000 rupees immediately & give me the OTP."');
        await new Promise((r) => setTimeout(r, 800));

        log('🤖 STEP 2: Speech-To-Text transcribes audio. Social Engineering Classifier runs...');
        const voiceRes = await api.evaluateVoice({
          transcript:
            'I am calling from your bank security division. Your account has been compromised. You need to transfer 25000 rupees immediately and give me your OTP to verify.',
        });
        log(`🎙️ STEP 3: Voice Vishing Risk Score: ${voiceRes.risk_score}/100! Detected: [${voiceRes.detected_patterns.join(', ')}]`);
        await new Promise((r) => setTimeout(r, 800));

        log('💳 STEP 4: Victim opens UPI app and attempts to transfer ₹25,000 to new recipient unknown@ybl...');
        await new Promise((r) => setTimeout(r, 800));

        log('⚡ STEP 5: Multi-Modal Context Engine correlates recent active voice call (Risk: 94) with transaction magnitude...');
        const txRes = await api.evaluateTransaction({
          amount: 25000,
          recipient: 'unknown@ybl',
          new_recipient: true,
          user_average_amount: 3000,
          recent_voice_risk: voiceRes.risk_score,
          recent_message_risk: 0,
        });

        log(`🔴 STEP 6: CRITICAL RISK DETECTED: ${txRes.risk_score}/100 (${txRes.risk_level})!`);
        log(`🛡️ STEP 7: Explainable warning displayed to user. User clicks [CANCEL PAYMENT].`);
        await api.executeTransaction(txRes.transaction_id, 'CANCELLED');
        log('✅ STEP 8: Fraud prevented! Event broadcasted live to Executive Dashboard.');
        setResultData(txRes);

      } else if (scenarioId === 'scenario_4_refund_scam') {
        log('🎙️ STEP 1: Scammer calls claiming: "Accidental refund of ₹4,500 was sent to your UPI. Approve the request to reverse."');
        const voiceRes = await api.evaluateVoice({
          transcript:
            'Hello sir, this is payment support. An accidental refund of 4500 rupees has been sent to your account. Open your app and approve payment request immediately.',
        });
        log(`🎙️ STEP 2: Voice Risk: ${voiceRes.risk_score}/100 (Refund lure detected).`);
        await new Promise((r) => setTimeout(r, 600));

        log('💳 STEP 3: User initiates ₹4,500 transfer to refund.agent@paytm...');
        const txRes = await api.evaluateTransaction({
          amount: 4500,
          recipient: 'refund.agent@paytm',
          new_recipient: true,
          user_average_amount: 3000,
          recent_voice_risk: voiceRes.risk_score,
          recent_message_risk: 0,
        });
        log(`🔴 STEP 4: Risk score ${txRes.risk_score}/100 (${txRes.risk_level}) - Warning presented.`);
        setResultData(txRes);

      } else if (scenarioId === 'scenario_5_electricity_msg') {
        log('📱 STEP 1: User receives urgent SMS: "Your power will be disconnected at 9 PM tonight unless bill of ₹3,500 is paid immediately."');
        const msgRes = await api.evaluateMessage(
          'Urgent notice: Electricity will be disconnected tonight at 9 PM due to pending bill update. Pay 3500 rupees immediately.'
        );
        log(`📱 STEP 2: Message Scam Risk: ${msgRes.risk_score}/100. Threat patterns detected.`);
        await new Promise((r) => setTimeout(r, 600));

        log('💳 STEP 3: User attempts payment to electricity.quickpay@upi...');
        const txRes = await api.evaluateTransaction({
          amount: 3500,
          recipient: 'electricity.quickpay@upi',
          new_recipient: true,
          user_average_amount: 3000,
          recent_voice_risk: 0,
          recent_message_risk: msgRes.risk_score,
        });
        log(`🔴 STEP 4: Context Engine correlated threat SMS with transfer: Score ${txRes.risk_score}/100 (${txRes.risk_level}).`);
        setResultData(txRes);

      } else if (scenarioId === 'scenario_6_false_positive') {
        log('Step 1: User pays ₹40,000 for legitimate house rent to new landlord...');
        const txRes = await api.evaluateTransaction({
          amount: 40000,
          recipient: 'landlord.rent@hdfc',
          new_recipient: true,
          user_average_amount: 3000,
          recent_voice_risk: 0,
          recent_message_risk: 0,
        });
        log(`Step 2: System flagged as ${txRes.risk_level} (Score: ${txRes.risk_score}/100) due to amount anomaly.`);
        await new Promise((r) => setTimeout(r, 600));

        log('Step 3: User proceeds with transaction and clicks [FALSE POSITIVE] button...');
        await api.submitFeedback({
          actual_feedback: 'FALSE_POSITIVE',
          transaction_id: txRes.transaction_id,
          prediction_risk_level: txRes.risk_level,
          prediction_risk_score: txRes.risk_score,
          user_comments: 'Legitimate monthly house rent payment',
        });
        log('Step 4: Feedback registered into database. False positive metric updated on dashboard.');
        setResultData(txRes);
      }
    } catch (err: any) {
      log(`❌ Error executing scenario: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const scenarios = [
    {
      id: 'scenario_3_main_bank_scam',
      title: 'Scenario 3: THE MAIN BANK VISHING DEMO (Twilio Call + OTP + ₹25k)',
      description:
        'The core hackathon flow: Bank impersonation call demanding OTP + ₹25,000 transfer to unknown@ybl -> Critical Risk 96/100 -> Explainability -> Cancel.',
      tag: 'FLAGSHIP DEMO',
      color: 'border-red-500/40 bg-red-950/20 hover:border-red-500/60',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
    {
      id: 'scenario_1_normal',
      title: 'Scenario 1: Normal Daily Payment (₹500 to Known Recipient)',
      description:
        'Standard everyday UPI payment to known recipient within normal user baseline -> Expected Risk: LOW (<30).',
      tag: 'BENCHMARK',
      color: 'border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'scenario_2_large_amount',
      title: 'Scenario 2: Large Amount Anomaly (₹50,000 to New Recipient)',
      description:
        'User attempts payment 16.6x above average to a completely new recipient without prior history -> Expected Risk: HIGH.',
      tag: 'ANOMALY',
      color: 'border-orange-500/30 bg-orange-950/10 hover:border-orange-500/50',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      id: 'scenario_4_refund_scam',
      title: 'Scenario 4: UPI Refund / Reversal Scam',
      description:
        'Scammer lures victim claiming an accidental refund was issued -> Prompts victim to send ₹4,500 to "reverse" the deposit.',
      tag: 'REFUND SCAM',
      color: 'border-cyan-500/30 bg-cyan-950/10 hover:border-cyan-500/50',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'scenario_5_electricity_msg',
      title: 'Scenario 5: Electricity Bill Disconnection Threat SMS + Payment',
      description:
        'Extortion SMS threatening power disconnection at 9 PM -> Followed by urgent ₹3,500 UPI transfer attempt.',
      tag: 'SMISHING',
      color: 'border-purple-500/30 bg-purple-950/10 hover:border-purple-500/50',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'scenario_6_false_positive',
      title: 'Scenario 6: False Positive Handling & Feedback Loop',
      description:
        'High-value genuine transaction (e.g. ₹40,000 house rent) flagged by system -> User confirms False Positive -> Model feedback recorded.',
      tag: 'FEEDBACK LOOP',
      color: 'border-blue-500/30 bg-blue-950/10 hover:border-blue-500/50',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <span>Interactive Demo Scenario Runner</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          One-click end-to-end execution of all 6 test and evaluation scenarios for hackathon demonstrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario List */}
        <div className="lg:col-span-7 space-y-3.5">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className={`glass-panel p-4.5 border transition-all duration-200 cursor-pointer ${sc.color} ${
                activeScenario === sc.id ? 'ring-2 ring-indigo-500' : ''
              }`}
              onClick={() => !running && runScenario(sc.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}
                    >
                      {sc.tag}
                    </span>
                    <h3 className="text-sm font-bold text-white">{sc.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{sc.description}</p>
                </div>
                <button
                  type="button"
                  disabled={running}
                  onClick={(e) => {
                    e.stopPropagation();
                    runScenario(sc.id);
                  }}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-colors"
                >
                  {running && activeScenario === sc.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Run Demo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Execution Console & Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 space-y-3 flex flex-col h-full min-h-[420px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Scenario Execution Stream
                </h3>
              </div>
              {running && (
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  PROCESSING
                </span>
              )}
            </div>

            {/* Step Logs */}
            <div className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 font-mono text-xs text-slate-300 space-y-2 overflow-y-auto max-h-72">
              {stepLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-center py-12">
                  Select any scenario from the left to execute the live multi-step demo flow.
                </div>
              ) : (
                stepLogs.map((logItem, idx) => (
                  <div key={idx} className="leading-relaxed flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">›</span>
                    <span className={logItem.includes('CRITICAL') ? 'text-red-400 font-bold' : ''}>
                      {logItem}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Result Box */}
            {resultData && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono">
                    Evaluation Result:
                  </span>
                  <RiskBadge level={resultData.risk_level} score={resultData.risk_score} size="md" />
                </div>
                <p className="text-xs text-slate-300">
                  {resultData.explanation || 'Scenario completed successfully.'}
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Recommended Action:{' '}
                  <strong className="text-white">{resultData.recommended_action}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
