import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Target, Zap, CheckCircle2, Calendar, X, Radio, Ban, ChevronRight, Clock } from 'lucide-react';
import { useCustomChallenge } from '../../../hooks/useCustomChallenge';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { Progress } from '../../ui/progress';
import { format } from 'date-fns';
import { ChallengeCancelConfirm } from './ChallengeCancelConfirm';

export function CustomChallengeProgress() {
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  const { user } = useSupabase();
  const { 
    loading, 
    hasActiveChallenge, 
    challenge, 
    actions, 
    dailyCompletions, 
    canCompleteToday,
    cancelCustomChallenge
  } = useCustomChallenge(user?.id);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Redirect if no challenge ID
  useEffect(() => {
    if (!challengeId) {
      navigate('/');
    }
  }, [challengeId]);

  // Redirect if no active challenge
  useEffect(() => {
    if (!loading && (!hasActiveChallenge || !challenge)) {
      navigate('/');
    }
  }, [loading, hasActiveChallenge, challenge]);

  const handleCancel = async () => {
    if (!challengeId) return;
    
    const success = await cancelCustomChallenge(challengeId);
    if (success) {
      navigate('/');
    }
  };
const navigateToCompleteDailyCustomChallenge = (id:string|undefined)=>{
  if(id){

    navigate(`/custom-challenge/${id}/daily`)
  }
}
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Challenge Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-orange-500 hover:text-orange-400"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-white">{challenge.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-gray-400 hover:text-red-400 transition-colors"
              title="Cancel Challenge"
            >
              <Ban size={20} />
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white">Progress</h3>
              <div className="text-orange-500 font-medium">
                {challenge.total_completions}/{challenge.target_completions} Completions
              </div>
            </div>
            <Progress 
              value={challenge.progress}
              max={100}
              className="bg-gray-700 h-2 mb-2"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <div>
                Started: {format(new Date(challenge.created_at), 'MMM d, yyyy')}
              </div>
              <div>
                {challenge.progress.toFixed(0)}% Complete
              </div>
            </div>
          </div>

          {/* Daily Actions */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white">Daily Actions</h3>
              <div className="text-sm text-gray-400">
                Minimum: <span className="text-white font-medium">{challenge.daily_minimum}</span>
              </div>
            </div>
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
              {actions.map((action) => (
                <div key={action.id} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white mt-1">
                      {action.sort_order + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{action.action_text}</div>
                      <div className="text-xs text-gray-400 mt-1">{action.description}</div>
                      <div className="text-xs text-orange-500 mt-1">{action.category}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {canCompleteToday ? (
              <div className="mt-4">
                <button
                  onClick={() => navigateToCompleteDailyCustomChallenge(challengeId)}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Complete Today's Actions</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <div className="inline-block px-3 py-1 bg-lime-500/10 text-lime-500 rounded-full text-sm">
                  Completed Today
                </div>
              </div>
            )}
          </div>

          {/* Recent Completions */}
          {dailyCompletions.length > 0 && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Recent Completions</h3>
              <div className="space-y-2 max-h-[20vh] overflow-y-auto pr-2">
                {dailyCompletions.slice(0, 5).map((completion) => (
                  <div key={completion.id} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {format(new Date(completion.completion_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {completion.actions_completed} actions
                      </span>
                      {completion.minimum_met ? (
                        <CheckCircle2 size={16} className="text-lime-500" />
                      ) : (
                        <X size={16} className="text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expert Guidance */}
          {challenge.expert_guidance && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Radio className="text-orange-500 mt-1" size={20} />
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Expert Guidance</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-line">{challenge.expert_guidance}</p>
                </div>
              </div>
            </div>
          )}

          {/* Rewards */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
              <Zap className="text-orange-500" size={20} />
              <span>Rewards</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Daily Completion:</span>
                <span className="text-orange-500 font-medium">+{challenge.fp_daily_reward} FP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Challenge Completion:</span>
                <span className="text-orange-500 font-medium">+{challenge.fp_completion_reward} FP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Potential:</span>
                <span className="text-orange-500 font-medium">
                  +{challenge.fp_daily_reward * challenge.target_completions + challenge.fp_completion_reward} FP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <ChallengeCancelConfirm
          onConfirm={handleCancel}
          onClose={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  );
}