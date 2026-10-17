export interface JudgeCriteriaScores {
  manual_grounding: number;
  safety_compliance: number;
  step_completeness: number;
  vernacular_accuracy: number;
}

export interface JudgeResult {
  criteria_scores: JudgeCriteriaScores;
  overall_score: number;
  verdict: 'PASS' | 'NEEDS_REVIEW';
  judge_reasoning: string;
  corrective_notes: string;
  retry_count?: number;
  original_score?: number | null;
  self_healing_applied?: boolean;
  judge_source?: string;
}

export interface SessionTurn {
  turn: number;
  timestamp: string;
  query: string;
  language: string;
  fault: string;
  severity: string;
  judge_score: number;
  judge_verdict: string;
  audio_url: string;
}

export interface DiagnoseResponse {
  equipment_type: string;
  fault_id: string;
  detected_anomaly: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  safety_lockout_required: boolean;
  confidence_score: number;
  manual_section_referenced: string;
  diagnostic_steps: string[];
  vernacular_text: string;
  vernacular_audio_url: string;
  audio_source: 'pregenerated_cache' | 'dynamic_tts';
  rag_delay_ms: number;
  judge: JudgeResult;
  context_turn_count: number;
  session_history: SessionTurn[];
}

export interface DialectOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

// Focused prototype: Tamil and Hindi only
export const SUPPORTED_DIALECTS: DialectOption[] = [
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', region: 'Tamil Nadu' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'North / Central India' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🌐', region: 'Global Field Ops' },
];
