import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, Target, Zap, ChevronRight } from 'lucide-react';
import { useCustomChallenge } from '../../../hooks/useCustomChallenge';
import { FPCongrats } from '../../ui/fp-congrats';
import { useSupabase } from '../../../contexts/SupabaseContext';
import type { CustomChallengeAction } from '../../../types/customChallenge';

export function CustomChallengeDailyForm() {
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  const { user } = useSupabase();
  const { 
    loading, 
    completing, 
    error: hookError, 
    challenge, 
    actions, 
    canCompleteToday,
    completeDailyActions
  } = useCustomChallenge(user?.id);

  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fpEarned, setFpEarned] = useState<number | null>(null);
  const [showFPCongrats, setShowFPCongrats] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Redirect if no challenge ID
  useEffect(() => {
    if (!challengeId) {
      navigate('/');
    }
  }, [challengeId]);

  // Redirect if challenge is not active or can't complete today
  useEffect(() => {
    if (!loading && (!challenge || challenge.status !== 'active' || !canCompleteToday)) {
      navigate(`/custom-challenge/${challengeId}`);
    }
  }, [loading, challenge, canCompleteToday, challengeId]);

  const handleToggleAction = (actionId: string) => {
    if (selectedActions.includes(actionId)) {
      setSelectedActions(selectedActions.filter(id => id !== actionId));
    } else {
      setSelectedActions([...selectedActions, actionId]);
    }
  };

  const handleSubmit = async () => {
    if (!challengeId || !user?.id) return;
    
    if (selectedActions.length < (challenge?.daily_minimum || 1)) {
      setError(`You must complete at least ${challenge?.daily_minimum} actions`);
      return;
    }
    
    if (selectedActions.length < (challenge?.daily_minimum || 1)) {
      setError(`You must complete at least ${challenge?.daily_minimum} actions`);
      return;
    }
    
    try {
      setError(null);

      const result = await completeDailyActions(
        challengeId,
        selectedActions.map(actionId => ({ action_id: actionId }))
      );

      if (result) {
        setSuccess(true);
        const totalFP = challenge?.fp_daily_reward || 0;
        
        // If challenge is completed, add completion reward
        if (challenge?.total_completions === challenge?.target_completions - 1) {
          setIsCompleted(true);
          setFpEarned((challenge?.fp_daily_reward || 0) + (challenge?.fp_completion_reward || 0));
        } else {
          setFpEarned(totalFP);
        }
        
        // Show FP congrats modal instead of redirecting immediately
        setShowFPCongrats(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Handle closing the FP Congrats modal
  const handleCloseFPCongrats = () => {
    setShowFPCongrats(false);
    // Navigate after closing the modal
    navigate(`/custom-challenge/${challengeId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show FP Congrats modal if success and showFPCongrats is true
  if (showFPCongrats && fpEarned) {
    return (
      <FPCongrats 
        fpEarned={fpEarned}
        category="challenge"
        onClose={handleCloseFPCongrats} 
      />
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-6 text-center">
          <div className="w-16 h-16 bg-lime-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-lime-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {isCompleted ? 'Challenge Completed!' : 'Daily Actions Completed!'}
          </h3>
          <div className="flex items-center justify-center gap-2 text-orange-500 font-bold text-2xl mb-4">
            <Zap size={24} />
            <span>+{fpEarned} FP</span>
          </div>
          
          {isCompleted ? (
            <p className="text-gray-300 mb-6">
              Congratulations! You've completed all 21 days of your custom challenge.
            </p>
          ) : (
            <p className="text-gray-300 mb-6">
              You've completed {challenge?.total_completions} of {challenge?.target_completions} days.
            </p>
          )}
          
          <button
            onClick={() => navigate(`/custom-challenge/${challengeId}`)}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-white">Daily Actions</h2>
          </div>
          <button
            onClick={() => navigate(`/custom-challenge/${challengeId}`)}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-1">{challenge?.name}</h3>
            <p className="text-gray-400">
              Completion {challenge?.total_completions} of {challenge?.target_completions}
            </p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">
                Daily Minimum: <span className="text-white font-medium">{challenge?.daily_minimum}</span>
              </div>
              <div className="text-sm text-orange-500 font-medium">
                +{challenge?.fp_daily_reward} FP
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Select at least {challenge?.daily_minimum} actions to complete today
            </div>
          </div>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
            {actions.map((action: CustomChallengeAction) => (
              <button
                key={action.id}
                onClick={() => handleToggleAction(action.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedActions.includes(action.id)
                    ? 'bg-lime-500/10 border border-lime-500/20'
                    : 'bg-gray-700/50 border border-gray-700/50 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    selectedActions.includes(action.id)
                      ? 'bg-lime-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {selectedActions.includes(action.id) ? (
                      <Check size={14} />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{action.action_text}</div>
                    <div className="text-xs text-gray-400 mt-1">{action.description}</div>
                    <div className="text-xs text-orange-500 mt-1">{action.category}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {(error || hookError) && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error || hookError}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-300">
              Selected: <span className="text-white font-medium">{selectedActions.length}</span>
              {challenge?.daily_minimum && (
                <span> / {challenge.daily_minimum} required</span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={completing || selectedActions.length < (challenge?.daily_minimum || 1)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Complete</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}