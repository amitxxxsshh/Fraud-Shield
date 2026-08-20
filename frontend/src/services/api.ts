import {
  TransactionRiskRequest,
  TransactionRiskResponse,
  VoiceAnalysisResponse,
  MessageRiskResponse,
  DashboardStats,
  DashboardCharts,
  LiveRiskEvent,
  FeedbackEntry,
  ModelMetadata,
  AuditLogItem
} from '../types';

// Determine backend API base URL
// Priority:
// 1. Explicit import.meta.env.VITE_API_URL (e.g. 'https://fraud-shield-erem.onrender.com')
// 2. Production fallback: 'https://fraud-shield-erem.onrender.com/api' (ensures Vercel deployment never calls localhost)
// 3. Development fallback: '/api' (proxied by Vite to local dev server)
const getApiBaseUrl = (): string => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && envApiUrl.trim()) {
    const sanitized = envApiUrl.trim().replace(/\/+$/, '');
    return sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`;
  }
  if (import.meta.env.PROD) {
    return 'https://fraud-shield-erem.onrender.com/api';
  }
  return '/api';
};

export const API_BASE = getApiBaseUrl();

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`API Error ${res.status}: ${errBody || res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Risk Assessments
  evaluateTransaction: (data: TransactionRiskRequest): Promise<TransactionRiskResponse> =>
    fetchJson<TransactionRiskResponse>(`${API_BASE}/risk/transaction`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  executeTransaction: (transactionId: string, action: 'PROCEEDED' | 'CANCELLED'): Promise<{ status: string; final_status: string }> =>
    fetchJson(`${API_BASE}/risk/transaction/execute`, {
      method: 'POST',
      body: JSON.stringify({ transaction_id: transactionId, action }),
    }),

  evaluateMessage: (messageText: string, senderPhone?: string): Promise<MessageRiskResponse> =>
    fetchJson<MessageRiskResponse>(`${API_BASE}/risk/message`, {
      method: 'POST',
      body: JSON.stringify({ message_text: messageText, sender_phone: senderPhone }),
    }),

  evaluateVoice: (data: { transcript?: string; audio_base64?: string; caller_phone?: string; consent_given?: boolean }): Promise<VoiceAnalysisResponse> =>
    fetchJson<VoiceAnalysisResponse>(`${API_BASE}/risk/voice`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRiskHistory: (limit = 25, eventType?: string): Promise<LiveRiskEvent[]> =>
    fetchJson<LiveRiskEvent[]>(`${API_BASE}/risk/history?limit=${limit}${eventType ? `&event_type=${eventType}` : ''}`),

  // Dashboard Analytics
  getDashboardStats: (): Promise<DashboardStats> =>
    fetchJson<DashboardStats>(`${API_BASE}/dashboard/stats`),

  getDashboardCharts: (): Promise<DashboardCharts> =>
    fetchJson<DashboardCharts>(`${API_BASE}/dashboard/charts`),

  getDashboardEvents: (limit = 15): Promise<LiveRiskEvent[]> =>
    fetchJson<LiveRiskEvent[]>(`${API_BASE}/dashboard/events?limit=${limit}`),

  // Feedback & False Positives
  submitFeedback: (data: {
    actual_feedback: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE';
    risk_event_id?: string;
    transaction_id?: string;
    prediction_risk_level?: string;
    prediction_risk_score?: number;
    user_comments?: string;
  }): Promise<{ status: string; message: string }> =>
    fetchJson(`${API_BASE}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFeedbackList: (limit = 50): Promise<FeedbackEntry[]> =>
    fetchJson<FeedbackEntry[]>(`${API_BASE}/feedback?limit=${limit}`),

  // Machine Learning
  getModelMetadata: (): Promise<ModelMetadata> =>
    fetchJson<ModelMetadata>(`${API_BASE}/ml/metadata`),

  // Privacy Center
  deleteUserData: (userId = 'demo-user-1'): Promise<{ status: string; message: string; purged_records: any }> =>
    fetchJson(`${API_BASE}/user/data?user_id=${userId}`, {
      method: 'DELETE',
    }),

  getPrivacyAuditLogs: (): Promise<AuditLogItem[]> =>
    fetchJson<AuditLogItem[]>(`${API_BASE}/user/privacy-audit`),
};
