export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskReason {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  weight?: number;
}

export interface TransactionRiskRequest {
  amount: number;
  recipient?: string;
  recipient_hash?: string;
  new_recipient: boolean;
  transaction_time?: string;
  user_average_amount?: number;
  transaction_frequency?: number;
  recent_voice_risk?: number;
  recent_message_risk?: number;
  device_risk?: number;
  user_id?: string;
}

export interface TransactionRiskResponse {
  transaction_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  reasons: RiskReason[];
  recommended_action: 'PROCEED' | 'VERIFY_RECIPIENT' | 'CANCEL_PAYMENT' | 'BLOCK_TRANSACTION';
  ml_probability?: number;
  explanation?: string;
  context_correlated: boolean;
  recipient_masked: string;
  recipient_hash: string;
  timestamp: string;
}

export interface VoiceAnalysisResponse {
  voice_event_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  detected_patterns: string[];
  transcript_excerpt: string[];
  confidence: number;
  explanation: string;
  timestamp: string;
}

export interface MessageRiskResponse {
  message_event_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  detected_patterns: string[];
  explanation: string;
  sender_hash?: string;
  timestamp: string;
}

export interface DashboardStats {
  total_transactions: number;
  high_risk_count: number;
  critical_risk_count: number;
  voice_scam_events: number;
  message_scam_events: number;
  false_positives: number;
  confirmed_fraud: number;
  average_risk_score: number;
  false_positive_rate: number;
}

export interface RiskTimelinePoint {
  timestamp: string;
  risk_score: number;
  amount: number;
  status: string;
}

export interface FactorDistribution {
  factor: string;
  count: number;
  impact: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface DashboardCharts {
  risk_over_time: RiskTimelinePoint[];
  risk_distribution: Record<string, number>;
  top_risk_factors: FactorDistribution[];
  voice_scam_categories: CategoryCount[];
  transaction_amount_ranges: Record<string, number>;
}

export interface LiveRiskEvent {
  id?: string;
  event_id?: string;
  event_type: string;
  risk_score: number;
  risk_level: RiskLevel;
  reasons?: RiskReason[] | string[];
  explanation?: string;
  recipient_masked?: string;
  amount?: number;
  timestamp: string;
}

export interface FeedbackEntry {
  id: string;
  risk_event_id?: string;
  transaction_id?: string;
  prediction_risk_level: string;
  prediction_risk_score: number;
  actual_feedback: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE';
  user_comments?: string;
  model_version: string;
  created_at: string;
}

export interface ModelMetadata {
  model_version: string;
  algorithm: string;
  trained_at?: string;
  num_features?: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix?: number[][];
  };
  feature_importance: Record<string, number>;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actor_id: string;
  details: Record<string, any>;
  created_at: string;
}
