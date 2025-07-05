export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  level: number;
  fuel_points: number;
  burn_streak: number;
  health_score: number;
  healthspan_years: number;
  lifespan: number;
  healthspan: number;
  onboarding_completed: boolean;
  avatar_url?: string;
  created_at: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  plan_status?: 'Active' | 'Trial' | 'Free Plan' | 'Preview' | 'Founders League';
  days_since_fp?: number;
  lifetime_prize_points?: number;
}