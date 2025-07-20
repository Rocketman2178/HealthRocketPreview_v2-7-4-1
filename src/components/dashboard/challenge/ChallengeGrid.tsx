import { useState, useEffect } from "react";
import { Award, History, Target } from "lucide-react";
import { Card } from "../../ui/card";
import { ChallengeCard } from "./ChallengeCard";
import { ChallengeLibrary } from "./ChallengeLibrary";
import { CustomChallengeCard } from "./CustomChallengeCard";
import { CompletedChallengesModal } from "./CompletedChallengesModal";
import { useChallengeManager } from "../../../hooks/useChallengeManager";
import { useCompletedActivities } from "../../../hooks/useCompletedActivities";
import { useCustomChallenge } from "../../../hooks/useCustomChallenge";

interface ChallengeGridProps {
  userId: string | undefined;
}

export function ChallengeGrid({ userId }: ChallengeGridProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCompletedChallenges, setShowCompletedChallenges] = useState(false);
  const { data: completedActivities } = useCompletedActivities(userId);
  const { hasActiveChallenge, challenge: customChallenge } =
    useCustomChallenge(userId);
  const {
    activeChallenges,
    loading,
    hasCompletedTier0,
    customChallengeCount,
    startChallenge,
    cancelChallenge,
    fetchActiveChallenges,
  } = useChallengeManager(userId);

  // Add an id to the main div for scrolling
  useEffect(() => {
    // Make sure the element is visible in the DOM when the component mounts
    const element = document.getElementById("challenges");
    if (element) {
      // Force a reflow to ensure the element is properly positioned
      void element.getBoundingClientRect();
    }

    // Force refresh active challenges when component mounts
    fetchActiveChallenges();

    // Log if we have an active custom challenge
    if (hasActiveChallenge && customChallenge) {
      console.log("Active custom challenge found:", customChallenge.name);
    }
  }, [fetchActiveChallenges]);

  // Calculate non-premium active challenges count
  const nonPremiumChallengesCount = activeChallenges.filter(
    (c) => c.category !== "Contests" && !c.challenge_id.startsWith("custom-")
  ).length;

  if (loading && activeChallenges.length === 0) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 bg-gray-700/50 rounded-lg"></div>
      </Card>
    );
  }

  return (
    <div id="challenges" className="space-y-4 scroll-mt-20">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Challenges</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {nonPremiumChallengesCount}/2 Challenges
          </span>
          <button
            onClick={() => setShowLibrary(true)}
            className="text-sm text-orange-500 hover:text-orange-400"
          >
            View All
          </button>
        </div>
      </div>

      {/* Active Challenges */}
      {activeChallenges.filter((c) => c.category !== "Contests").length > 0 ? (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Target className="text-orange-500" size={20} />
              <h3 className="text-sm font-medium text-white">
                Active Challenges
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeChallenges
              .filter((challenge) => challenge.category !== "Contests")
              .map((challenge) => {
                // Find full challenge details
                const enrichedChallenge = {
                  ...challenge,
                  isPremium: false,
                };

                return (
                  <ChallengeCard
                    userId={userId}
                    key={`${challenge.id}-${challenge.name}`}
                    challenge={enrichedChallenge}
                    onCancel={(challengeId) => cancelChallenge(challengeId)}
                  />
                );
              })}
          </div>
        </Card>
      ) : (
        <Card className="relative">
          <div className="flex flex-col items-center justify-center py-2.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <Award className="text-orange-500" size={24} />
              {nonPremiumChallengesCount}/2 Regular Challenges
              {customChallengeCount > 0 && ` + ${customChallengeCount} Custom`}
            </div>
            <button
              onClick={() => setShowLibrary(true)}
              className="flex items-center gap-2 px-3.5 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Award size={16} />
              Select a Challenge
            </button>
          </div>
        </Card>
      )}

      {/* Custom Challenge Card */}
      <CustomChallengeCard />

      <div className="text-xs text-gray-400 italic text-center">
        Unlock More Challenges After Completion
      </div>

      {/* Completed Challenges Section */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Award className="text-orange-500" size={16} />
              <span>
                Completed Challenges ({completedActivities.challengesCompleted})
              </span>
            </h3>
          </div>
          <button
            onClick={() => setShowCompletedChallenges(true)}
            className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-400 transition-colors"
          >
            <History size={14} />
            <span>View History</span>
          </button>
        </div>
      </Card>

      {showCompletedChallenges && (
        <CompletedChallengesModal
          onClose={() => setShowCompletedChallenges(false)}
        />
      )}

      {showLibrary && (
        <ChallengeLibrary
          userId={userId}
          hasCompletedTier0={hasCompletedTier0}
          currentChallenges={activeChallenges}
          onClose={() => setShowLibrary(false)}
          onStartChallenge={startChallenge}
          activeChallengesCount={activeChallenges.length}
        />
      )}
    </div>
  );
}
