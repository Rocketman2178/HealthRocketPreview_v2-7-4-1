export type Gender = 'Male' | 'Female' | 'Prefer Not To Say';

export type Gender = 'Male' | 'Female' | 'Prefer Not To Say';

export interface HealthUpdateData {
  expectedLifespan: number;
  expectedHealthspan: number;
  gender: Gender;
  gender: Gender;
  categoryScores: CategoryScores;
  healthGoals?: string;
  error?: Error | null;
  healthGoals?: string;
  error?: Error | null;
}

export interface CategoryScores {
  mindset: number;
  sleep: number;
  exercise: number;
  nutrition: number;
  biohacking: number;
}