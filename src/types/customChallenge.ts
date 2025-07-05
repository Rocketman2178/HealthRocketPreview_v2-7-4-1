export interface CustomChallenge {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'completed' | 'cancelled';
  completion_count: number;
  daily_minimum: number;
  total_completions: number;
  target_completions: number;
  progress: number;
  created_at: string;
  completed_at?: string;
  expert_guidance?: string;
  fp_completion_reward: number;
  fp_daily_reward: number;
  last_completion_date?: string;
}

export interface CustomChallengeAction {
  id: string;
  custom_challenge_id: string;
  action_text: string;
  description: string;
  category: 'Mindset' | 'Sleep' | 'Exercise' | 'Nutrition' | 'Biohacking';
  sort_order: number;
  created_at: string;
}

export interface CustomChallengeDailyCompletion {
  id: string;
  completion_date: string;
  actions_completed: number;
  minimum_met: boolean;
  action_completions: CustomChallengeActionCompletion[];
}

export interface CustomChallengeActionCompletion {
  id: string;
  action_id: string;
  completed: boolean;
}

export interface CustomChallengeFormAction {
  id?: string;
  action_text: string;
  description: string;
  category: 'Mindset' | 'Sleep' | 'Exercise' | 'Nutrition' | 'Biohacking';
}

export interface CustomChallengeFormData {
  name: string;
  daily_minimum: number;
  actions: CustomChallengeFormAction[];
  expert_guidance?: string;
}