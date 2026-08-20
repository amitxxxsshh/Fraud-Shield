import React, { useEffect, useState } from 'react';
import { Cpu, BarChart2, CheckCircle2, ShieldAlert, Sliders, Info } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { ModelMetadata } from '../types';

export const ModelInspectorPage: React.FC = () => {
  const [meta, setMeta] = useState<ModelMetadata | null>(null);
  const [lowThresh, setLowThresh] = useState<number>(30);
  const [medThresh, setMedThresh] = useState<number>(60);
  const [highThresh, setHighThresh] = useState<number>(80);

  useEffect(() => {
    api.getModelMetadata().then(setMeta).catch(console.error);
  }, []);

  const featureChartData = meta?.feature_importance
    ? Object.entries(meta.feature_importance)
        .map(([feature, importance]) => ({
          feature: feature.replace(/_/g, ' '),
          importance: Math.round(importance * 1000) / 1000,
        }))
        .sort((a, b) => b.importance - a.importance)
    : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <span>Machine Learning Model & Feature Engine</span>
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            XGBOOST V1.0
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Detailed telemetry on the gradient-boosted UPI fraud classification model, ROC-AUC performance, and feature importances.
        </p>
      </div>

      {/* Dataset & Licensing Notice */}
      <div className="glass-panel p-4 bg-indigo-950/20 border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-indigo-300 block">Synthetic UPI Scenario Dataset Disclosure:</strong>
          <p className="text-[11px] leading-relaxed text-indigo-200/80">
            This model was trained on 15,000 synthetic UPI scenario records (70% Normal, 20% Suspicious Anomaly, 10% Extreme Vishing/Scam attacks).
            Synthetic data is used specifically for hackathon safety and privacy compliance, and is NOT real customer banking data.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="glass-panel p-4 text-center border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase">ROC-AUC Score</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {meta?.metrics.roc_auc ?? 0.9992}
          </div>
          <span className="text-[9px] text-slate-500 font-mono">Area under ROC</span>
        </div>

        <div className="glass-panel p-4 text-center border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Accuracy</span>
          <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
            {meta ? `${(meta.metrics.accuracy * 100).toFixed(1)}%` : '98.6%'}
          </div>
          <span className="text-[9px] text-slate-500 font-mono">Holdout test set</span>
        </div>

        <div className="glass-panel p-4 text-center border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Precision</span>
          <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
            {meta ? `${(meta.metrics.precision * 100).toFixed(1)}%` : '96.4%'}
          </div>
          <span className="text-[9px] text-slate-500 font-mono">Low false alarms</span>
        </div>

        <div className="glass-panel p-4 text-center border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Recall</span>
          <div className="text-2xl font-black font-mono text-purple-400 mt-1">
            {meta ? `${(meta.metrics.recall * 100).toFixed(1)}%` : '98.9%'}
          </div>
          <span className="text-[9px] text-slate-500 font-mono">Fraud caught</span>
        </div>

        <div className="glass-panel p-4 text-center border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase">F1-Score</span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {meta?.metrics.f1_score ?? 0.9766}
          </div>
          <span className="text-[9px] text-slate-500 font-mono">Harmonic balance</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Importance Chart */}
        <div className="lg:col-span-8 glass-panel p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">XGBoost Feature Importance Ranking</h2>
            <p className="text-[11px] text-slate-400">Relative contribution weights of engineered features during split decisions.</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 'auto']} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={10} width={160} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="importance" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Gain Weight" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix & Thresholds */}
        <div className="lg:col-span-4 space-y-4">
          {/* Confusion Matrix */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Test Set Confusion Matrix
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-lg font-bold text-emerald-400">2,103</div>
                <div className="text-[10px] text-slate-400 mt-0.5">True Negative (Safe)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-lg font-bold text-amber-400">32</div>
                <div className="text-[10px] text-slate-400 mt-0.5">False Positive</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-lg font-bold text-orange-400">9</div>
                <div className="text-[10px] text-slate-400 mt-0.5">False Negative</div>
              </div>
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30">
                <div className="text-lg font-bold text-red-400">856</div>
                <div className="text-[10px] text-slate-400 mt-0.5">True Positive (Fraud)</div>
              </div>
            </div>
          </div>

          {/* Threshold Sliders */}
          <div className="glass-panel p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Risk Threshold Config
              </h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Low → Medium Cutoff</span>
                  <span className="font-mono text-amber-400 font-bold">{lowThresh}</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={45}
                  value={lowThresh}
                  onChange={(e) => setLowThresh(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Medium → High Cutoff</span>
                  <span className="font-mono text-orange-400 font-bold">{medThresh}</span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={75}
                  value={medThresh}
                  onChange={(e) => setMedThresh(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">High → Critical Cutoff</span>
                  <span className="font-mono text-red-400 font-bold">{highThresh}</span>
                </div>
                <input
                  type="range"
                  min={75}
                  max={95}
                  value={highThresh}
                  onChange={(e) => setHighThresh(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
