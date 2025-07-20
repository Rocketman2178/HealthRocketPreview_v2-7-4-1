import { Card } from '../../ui/card';
import { StreakProgress } from './StreakProgress';
import { BoostCategory } from './BoostCategory';
import { boostCategories } from '../../../data/boostCategories'; 
import { calculateStreakInfo } from '../../../lib/utils';
import { BoostState, CompletedBoost } from '../../../types/dashboard';

interface DailyBoostsProps {
  burnStreak: number;
  completedBoosts: CompletedBoost[];
  selectedBoosts: BoostState[] | [];
  weeklyBoosts: BoostState[] | [];
  daysUntilReset: number;
  todayStats: {
    boostsCompleted: number;
    boostsRemaining: number;
    fpEarned: number;
    burnStreak: number;
  };
  onCompleteBoost?: (id: string,boostCategory:string) => Promise<void>;
}

export function DailyBoosts({ 
  completedBoosts,
  selectedBoosts,
  weeklyBoosts,
  daysUntilReset,
  todayStats,
  onCompleteBoost,
  burnStreak = 0
}: DailyBoostsProps) {
  const maxDailyBoosts = 3;
  const availableBoosts = todayStats.boostsRemaining;
  
  const streakInfo = calculateStreakInfo(
    burnStreak,
    completedBoosts,
    todayStats.boostsCompleted,
    maxDailyBoosts,
    todayStats.fpEarned
  );

  return (
    <div id="boosts" className="space-y-4 scroll-mt-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Daily Boosts</h2>
        <div className="text-sm text-gray-400">
          <span className="text-orange-500">{todayStats.boostsCompleted}</span> of {maxDailyBoosts} completed today
        </div>
      </div>

      <Card>
        <StreakProgress 
          burnStreak={burnStreak}
          {...streakInfo}
        />
        
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm">
                <span className="text-gray-400">Daily Boosts Available:</span>
                <span className="text-orange-500 ml-1">{availableBoosts}/{maxDailyBoosts}</span>
              </div>
              <div className="text-sm text-gray-400">FP Earned Today: <span className="text-orange-500">+{todayStats.fpEarned}</span></div>
            </div>
            <div className="text-sm text-gray-400">
              <span className="text-orange-500">{daysUntilReset}</span> {daysUntilReset === 1 ? 'Day' : 'Days'} Until Reset
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-400 italic text-center">
            Complete 1 Boost per Category to Unlock Tier 2 Boosts
          </div>
          <div className="mt-1 text-xs text-gray-400 italic text-center">
            Burn Streaks based on Eastern Time (EST/EDT)
          </div>
        </div>
        
        {/* Boost Categories */}
        <div className="space-y-6 mt-6">
          {boostCategories.map(category => (
            <BoostCategory
              key={category.name}
              name={category.name}
              icon={category.icon}
              boosts={category.boosts}
              completedBoosts={completedBoosts}
              selectedBoosts={selectedBoosts}
              weeklyBoosts={weeklyBoosts}
              boostsRemaining={availableBoosts}
              onComplete={onCompleteBoost}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}