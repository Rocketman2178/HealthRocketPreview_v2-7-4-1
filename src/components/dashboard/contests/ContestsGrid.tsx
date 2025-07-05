import { useState, useEffect } from 'react';
import { Award, History, Target, Trophy } from 'lucide-react';
import { Card } from '../../ui/card';
import { ContestLibrary } from './ContestLibrary';
import { ContestCard } from './ContestCard';
import { CompletedContestsCard } from './CompletedContestsCard';
import { contestChallenges } from '../../../data/challenges/contestChallenges';
import { CompletedChallengesModal } from '../challenge/CompletedChallengesModal';
import { useContestManager } from '../../../hooks/useContestManager';
import { useCompletedActivities } from '../../../hooks/useCompletedActivities';

interface ContestsGridProps {
  userId: string | undefined;
  categoryScores: Record<string, number>;
}

export function ContestsGrid({ userId, categoryScores }: ContestsGridProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCompletedContests, setShowCompletedContests] = useState(false);
  const { data: completedActivities } = useCompletedActivities(userId);
  const {
    activeContests,
    loading,
    startContest,
    cancelContest,
    fetchActiveContests
  } = useContestManager(userId);

  useEffect(() => {
    console.log('Active contests in ContestsGrid:', activeContests);
  }, [activeContests]);

  // Listen for dashboard updates to refresh contests
  useEffect(() => {
    const handleDashboardUpdate = async (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.contestRegistered) {
        console.log('Contest registration detected, refreshing contests');
        await fetchActiveContests();
      }
    };

    window.addEventListener('dashboardUpdate', handleDashboardUpdate);
    return () => {
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate);
    };
  }, [fetchActiveContests]);

  if (loading && activeContests.length === 0) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 bg-gray-700/50 rounded-lg"></div>
      </Card>
    );
  }

  return (
    <div id="contests" className="space-y-4 scroll-mt-20">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Contests</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <Trophy size={14} className="text-orange-500" />
            <span>{activeContests.length} Active</span>
          </span>
          <button
            onClick={() => setShowLibrary(true)}
            className="text-sm text-orange-500 hover:text-orange-400"
          >
            View All
          </button>
        </div>
      </div>

      {/* Active Contests */}
      {activeContests.length > 0 ? (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Target className="text-orange-500" size={20} />
                <h3 className="text-sm font-medium text-white">Your Active Contests</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeContests.map(contest => {
                return (
                  <ContestCard
                    userId={userId}
                    key={`${contest.id}-${contest.name}`}
                    contest={contest}
                  />
                );
              })}
            </div>
            
            {/* View More Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowLibrary(true)}
                className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors flex items-center gap-2"
              >
                <span>View More Contests</span>
                <Target size={16} />
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="relative">
          <div className="flex flex-col items-center justify-center py-2.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <Award className="text-orange-500" size={24} />
              <h3 className="text-lg font-medium text-white">Join the Contest Arena</h3>
            </div>
            <p className="text-sm text-gray-400 mb-2">Compete against other players for prizes and glory</p>
            <button
              onClick={() => {
                // Refresh active contests before showing library
                fetchActiveContests().then(() => {
                  setShowLibrary(true);
                });
              }}
              className="flex items-center gap-2 px-3.5 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Trophy size={16} />
              Browse Contests
            </button>
          </div>
        </Card>
      )}

      {/* Completed Contests Section */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Trophy className="text-orange-500" size={16} />
            <span>Completed Contests</span>
          </h3>
          <button
            onClick={() => setShowCompletedContests(true)}
            className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-400 transition-colors"
          >
            <History size={14} />
            <span>View History</span>
          </button>
        </div>
        
        {/* Completed Contests Card */}
        <CompletedContestsCard />
      </Card>

      {showCompletedContests && (
        <CompletedChallengesModal
          onClose={() => setShowCompletedContests(false)}
        />
      )}

      {showLibrary && (
        <ContestLibrary
          userId={userId}
          categoryScores={categoryScores}
          currentChallenges={activeContests}
          onClose={() => setShowLibrary(false)}
          onStartChallenge={startContest}
          activeChallengesCount={activeContests.length}
        />
      )}
    </div>
  );
}