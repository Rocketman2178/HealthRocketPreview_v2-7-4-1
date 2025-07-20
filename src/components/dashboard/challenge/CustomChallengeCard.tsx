import { useNavigate } from "react-router-dom";
import { Award, Zap, CheckCircle2, Target, Loader2 } from "lucide-react";
import { Card } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { useCustomChallenge } from "../../../hooks/useCustomChallenge";
import { useSupabase } from "../../../contexts/SupabaseContext";

export function CustomChallengeCard() {
  const navigate = useNavigate();
  const { user } = useSupabase();
  const {
    loading,
    hasActiveChallenge,
    challenge,
    fpCompletionReward,
    fpDailyReward,
    canCompleteToday,
  } = useCustomChallenge(user?.id);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        </div>
      </Card>
    );
  }
  const handleNavigateToCustomChallenge = (id: string) => {
    if (id) {
      navigate(`/custom-challenge/${id}`);
    }
  };
  const navigateToCustomChallengeCreatePage = () => {
    navigate("/custom-challenge/create");
  };
  // If user has an active custom challenge, show it
  if (hasActiveChallenge && challenge) {
    return (
      <Card>
        <div
          onClick={() => handleNavigateToCustomChallenge(challenge?.id)}
          aria-disabled={!challenge?.id}
          tabIndex={challenge?.id ? 0 : -1}
          className={`${challenge?.id?"cursor-pointer":""} p-4 relative`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Award className="text-orange-500" size={24} />
              <div>
                <h3 className="font-bold text-white">{challenge.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">
                    Custom
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">Tier 0</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-orange-500">
              <Zap size={16} />
              <span className="font-medium">
                +{challenge.fp_completion_reward} FP
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Progress
              value={challenge.progress}
              max={100}
              className="bg-gray-700 h-2"
            />
            <div className="flex justify-between">
              <div className="flex items-center gap-1 text-lime-500">
                <CheckCircle2 size={12} />
                <span>
                  {challenge.total_completions}/{challenge.target_completions}{" "}
                  Completions
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-500 font-medium">
                  +{challenge.fp_daily_reward} FP Daily
                </span>
              </div>
            </div>
            {canCompleteToday && (
              <div className="mt-2 text-xs text-center">
                <span className="text-lime-500 bg-lime-500/10 px-2 py-1 rounded-full">
                  Ready for Today's Actions
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // If user doesn't have an active challenge, show the create card
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Target className="text-orange-500" size={24} />
            <div>
              <h3 className="font-bold text-white">Create Custom Challenge</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">
                  Custom
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">21 Completions</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-orange-500">
            <Zap size={16} />
            <span className="font-medium">+{fpCompletionReward} FP</span>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-4">
          Create your own personalized challenge with actions that fit your
          lifestyle
        </p>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">
            <span className="text-orange-500">+{fpDailyReward} FP</span> daily
          </div>
          <button
            onClick={navigateToCustomChallengeCreatePage}
            className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
          >
            Create Challenge
          </button>
        </div>
      </div>
    </Card>
  );
}
