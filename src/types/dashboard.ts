import { DivideIcon as LucideIcon } from 'lucide-react';

export interface Boost {
  id: string;
  name: string;
  fp: number;
  tier: 1 | 2;
  description: string;
  lastCompleted?: Date;
  category: string;
}

export interface CompletedBoost {
  id: string;
  completedAt: Date;
  baseReward: number;
  bonusReward: number;
}

export interface BoostCategory {
  name: string;
  icon: LucideIcon;
  boosts: Boost[];
  maxDailyBoosts: number;
}

export interface StreakInfo {
  currentStreak: number;
  nextMilestone: number;
  milestoneReward: number;
  progress: number;
  dailyBoostsCompleted: number;
  maxDailyBoosts: number;
  availableBoosts: number;
  bonusMultiplier: number;
}

export interface Quest {
  id: string;
  name: string;
  category: string;
  description: string;
  requirements: string[];
  verificationMethods: string[];
  expertReference?: string;
  progress: number;
  duration: number;
  daysRemaining: number;
  canCompleteNextWeek?: boolean;
  daysUntilNextWeek?: number | null;
  fuelPoints: number;
  status?: 'active' | 'available' | 'completed' | 'locked';
  tier?: 1 | 2;
}

export interface Challenge {
  id: string;
  name: string;
  challenge_id:string;
  category: string;
  relatedCategories:string[];
  description: string;
  learningObjectives?: string[];
  requirements: Array<string | { description: string; verificationMethod?: string }>;
  verificationMethod: string | { description: string; requiredFrequency?: string } | null;
  expertReference?: string;
  expertTips?: string[];
  successMetrics?: string[];
  implementationProtocol?: {
    week1: string;
    week2: string;
    week3: string;
  };
  progress: number;
  boostCount:number;
  last_daily_boost_completed_date:string;
  duration: number;
  daysRemaining: number;
  fuelPoints: number;
  daysUntilStart?: number | null;
  verification_count?: number;
  verifications_required?: number;
  entryFee?: number;
  minPlayers?: number;
  status?: 'active' | 'available' | 'completed' | 'locked';
  registrationEndDate?: string;
  community_id?: string | null;
  community_name?: string | null;
}

export interface RankProgress {
  rank: number;
  percentile: number;
  heroAchieved: boolean;
  pointsToLegend: number;
  currentPoints: number;
  legendThresholdPoints: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  revenue: number;
  growth: number;
}

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}

export interface CardProps {
  id?:string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export interface BoostState {
  id: string;
  completedAt: Date;
  weekStartDate: Date;
}

export interface UserProgress {
  quests: CompletedQuest[];
  challenges: CompletedChallenge[];
  totalFpEarned: number;
  totalBoostsCompleted: number;
  questsCompleted: number;
  challengesCompleted: number;
}