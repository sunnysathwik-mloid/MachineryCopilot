export interface SessionTurn {
  turn: number;
  timestamp: string;
  user_query: string;
  language: string;
  equipment: string;
  anomaly: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  audio_url: string;
}

export interface DiagnoseResponse {
  equipment_type: string;
  detected_anomaly: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  safety_lockout_required: boolean;
  confidence_score: number;
  diagnostic_steps: string[];
  vernacular_text: string;
  vernacular_audio_url: string;
  audio_source: 'pregenerated_cache' | 'dynamic_tts';
  artificial_rag_delay_ms: number;
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

export const SUPPORTED_DIALECTS: DialectOption[] = [
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', region: 'Tamil Nadu' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'North / Central India' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', region: 'Andhra / Telangana' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'Karnataka' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', region: 'Maharashtra' },
  { code: 'en', name: 'English', nativeName: 'English (Industrial)', flag: '🌐', region: 'Global Field Ops' },
];
