import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Brain, Moon, Activity, Apple, Database, CheckSquare, X, Check } from 'lucide-react';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { FPCongrats } from '../../ui/fp-congrats';
import { supabase } from '../../../lib/supabase';

export function ChallengeDailyForm() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dailyActions, setDailyActions] = useState<any[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fpEarned, setFpEarned] = useState(0);
  const [showFPCongrats, setShowFPCongrats] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeName, setChallengeName] = useState('');
  const [canCompleteToday, setCanCompleteToday] = useState(true);
  const [verificationCount, setVerificationCount] = useState(0);
  const [verificationRequired, setVerificationRequired] = useState(21);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [isChallengeFullyCompleted, setIsChallengeFullyCompleted] = useState(false);
  const [isChallengeAlreadyCompletedInDb, setIsChallengeAlreadyCompletedInDb] = useState(false);

  useEffect(() => {
    const fetchDailyActions = async () => {
      if (!challengeId || !user) {
        navigate('/', { replace: true });
        return;
      }

      try {
        setLoading(true);
        
        // Get challenge details
        const { data: challengeData, error: challengeError } = await supabase
          .from('challenges')
          .select('name, status, verification_count, verifications_required')
          .eq('user_id', user.id)
          .eq('challenge_id', challengeId)
          .maybeSingle();
          
        if (challengeError) throw challengeError;
        
        if (!challengeData) {
          // Challenge not found or not active
          setError('Challenge not found or not active');
          navigate('/', { replace: true });
          return;
        }
        
        setChallengeName(challengeData.name);
        setVerificationCount(challengeData.verification_count || 0);
        setVerificationRequired(challengeData.verifications_required || 21);
        setIsChallengeFullyCompleted(challengeData.status === 'completed');
        
        // Get daily actions for this challenge
        const { data: actionsData, error: actionsError } = await supabase.rpc(
          'get_challenge_daily_actions',
          { p_challenge_id: challengeId }
        );
        
        if (actionsError) throw actionsError;
        setDailyActions(actionsData || []);
        
        // Check if user can complete actions today
        const { data: statusData, error: statusError } = await supabase.rpc(
          'get_challenge_daily_status',
          { 
            p_user_id: user.id,
            p_challenge_id: challengeId
          }
        );
        
        if (statusError) throw statusError;
        
        if (statusData?.success) {
          const canComplete = statusData.can_complete_today || false;
          setCanCompleteToday(canComplete);
          setAlreadyCompletedToday(!canComplete);
        }
      } catch (err) {
        console.error('Error fetching daily actions:', err);
        setError('Failed to load challenge actions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDailyActions();
  }, [challengeId, user, navigate]);
  
  const handleToggleAction = (actionId: string) => {
    setSelectedActions(prev => {
      if (prev.includes(actionId)) {
        return prev.filter(id => id !== actionId);
      } else {
        return [...prev, actionId];
      }
    });
  };
  
  const handleSubmit = async () => {
    if (!user || !challengeId || selectedActions.length < 2) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Selected actions:', selectedActions);
      console.log('Daily actions available:', dailyActions);
      
      // Format selected actions
      const completedActions = selectedActions.map(actionId => {
        // Find the action in dailyActions
        const action = dailyActions.find(a => a.id === actionId);
        
        // Initialize with guaranteed non-null, non-empty values
        const fallbackChallengeName = challengeName || 'Daily Challenge';
        let actionText = "Daily Action";
        let itemName = `Challenge Action - ${fallbackChallengeName}`;
        
        // Try to get action_text from the found action with robust validation
        if (action && action.action_text !== null && action.action_text !== undefined) {
          const rawText = String(action.action_text).trim();
          if (rawText && 
              rawText.length > 0 && 
              rawText.toLowerCase() !== 'null' && 
              rawText.toLowerCase() !== 'undefined' &&
              rawText.toLowerCase() !== 'nan' &&
              rawText !== '0' &&
              rawText !== 'false') {
            actionText = rawText;
          }
        }
        
        // If we still don't have valid action text, create one based on actionId or timestamp
        if (!actionText || actionText.trim().length === 0 || actionText === "Daily Action") {
          if (actionId && typeof actionId === 'string' && actionId.length > 0) {
            const suffix = actionId.slice(-8);
            actionText = `Daily Action ${suffix}`;
          } else {
            const timestamp = Date.now().toString().slice(-6);
            actionText = `Daily Action ${timestamp}`;
          }
        }
        
        // Set itemName to actionText if we have a valid actionText, otherwise use fallback
        if (actionText && actionText !== "Daily Action") {
          itemName = actionText;
        }
        
        // Final safety checks to ensure we never have null/empty values
        if (!actionText || typeof actionText !== 'string' || actionText.trim().length === 0) {
          actionText = `Challenge Action ${Date.now().toString().slice(-8)}`;
        }
        
        if (!itemName || typeof itemName !== 'string' || itemName.trim().length === 0) {
          itemName = actionText; // Use actionText as fallback since we know it's valid at this point
        }
        
        // Ensure itemName is never longer than database limits (255 chars)
        if (itemName.length > 255) {
          itemName = itemName.substring(0, 252) + '...';
        }
        
        // Ensure actionText is also within reasonable limits
        if (actionText.length > 255) {
          actionText = actionText.substring(0, 252) + '...';
        }
        
        return {
          action_text: actionText,
          item_name: itemName,
          challenge_name: fallbackChallengeName
        };
      });
      
      console.log('Formatted completed actions:', completedActions);
      console.log('Completed actions length:', completedActions.length);
      
      // Use all completed actions - action_id values are strings, not UUIDs
      const validCompletedActions = completedActions;
      
      // Validate minimum actions
      if (validCompletedActions.length < 2) {
        setError('Minimum 2 actions required');
        return;
      }
      
      // Submit completed actions
      const { data, error } = await supabase.rpc(
        'complete_challenge_daily_actions',
        {
          p_user_id: user.id,
          p_challenge_id: challengeId,
          p_completed_actions: JSON.stringify(validCompletedActions)
        }
      );
      
      console.log('RPC response:', { data, error });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to complete daily actions');
      }
      
      // Set success state
      setSuccess(true);
      setFpEarned(data.fp_earned || 10);
      setShowFPCongrats(true);
      setChallengeCompleted(data.challenge_completed || false);
      
      // Trigger dashboard update
      window.dispatchEvent(new CustomEvent('dashboardUpdate', {
        detail: {
          fpEarned: data.fp_earned,
          updatedPart: data.challenge_completed ? 'challenge' : 'boost',
          category: 'general',
          challengeCompleted: data.challenge_completed
        }
      }));
      
      // Delay redirect until after FP Congrats is dismissed
    } catch (err) {
      console.error('Error completing daily actions:', err);
      
      // Check if this is a duplicate key constraint violation (PostgreSQL error code 23505)
      if (err.message.includes('duplicate key value violates unique constraint') && 
          err.message.includes('new_completed_challenges_user_challenge_key')) {
        // Challenge is already marked as completed in the database
        setIsChallengeAlreadyCompletedInDb(true);
        setChallengeCompleted(true);
        setError(null); // Clear any previous errors
        
        // Trigger dashboard update to reflect the completed state
        window.dispatchEvent(new CustomEvent('dashboardUpdate', {
          detail: {
            fpEarned: 0, // No additional FP since it's already completed
            updatedPart: 'challenge',
            category: 'general',
            challengeCompleted: true
          }
        }));
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle closing the FP Congrats modal
  const handleCloseFPCongrats = () => {
    setShowFPCongrats(false);
    // Navigate after closing the modal
    navigate('/', { 
      replace: true, 
      state: { fromDaily: true }
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        <p className="text-white mt-4">Loading challenge actions...</p>
      </div>
    );
  }

  // Show FP Congrats modal if success and showFPCongrats is true
  if (showFPCongrats) {
    return (
      <FPCongrats 
        fpEarned={fpEarned} 
        category={challengeCompleted ? "challenge" : "daily"} 
        onClose={handleCloseFPCongrats} 
      />
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-lime-500/20 rounded-full flex items-center justify-center mx-auto">
            <Check className="text-lime-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">
            {challengeCompleted ? 'Challenge Completed!' : 'Daily Actions Completed!'}
          </h3>
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-orange-500">
            <span>+{fpEarned} FP</span>
          </div>
          
          {challengeCompleted ? (
            <p className="text-gray-300">
              Congratulations! You've completed all required days for this challenge.
            </p>
          ) : (
            <p className="text-gray-300">
              Great job! Keep completing daily actions to finish the challenge.
            </p>
          )}
          
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // If challenge is already completed in database but UI was out of sync
  if (isChallengeAlreadyCompletedInDb) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-lime-500/20 rounded-full flex items-center justify-center mx-auto">
            <Check className="text-lime-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Challenge Already Completed!</h3>
          <p className="text-gray-300">
            This challenge has already been completed and recorded in your account. Your progress may have been out of sync, but everything is now updated correctly.
          </p>
          <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Final Status:</span>
              <span className="text-lime-500 font-medium">✓ Completed</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If already completed today, show the completed state
  if (alreadyCompletedToday) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
            <Check className="text-orange-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Already Completed Today</h3>
          <p className="text-gray-300">
            You've already completed your daily actions for this challenge today. Come back tomorrow to continue your progress!
          </p>
          <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Progress:</span>
              <span className="text-orange-500 font-medium">{verificationCount} / {verificationRequired} days</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Return to Dashboard
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
          <h2 className="text-xl font-bold text-white">{challengeName}</h2>
          <button
            onClick={() => navigate('/', { 
              replace: true, 
              state: { fromDaily: true }
            })}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <h3 className="text-lg font-medium text-white">Complete Daily Actions</h3>
          <p className="text-sm text-gray-300 mb-6">
            Select at least 2 actions that you've completed today:
          </p>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-3 mb-6">
            {dailyActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleToggleAction(action.id)}
                disabled={!canCompleteToday}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedActions.includes(action.id)
                    ? 'bg-orange-500/20 border border-orange-500/50'
                    : 'bg-gray-700/50 border border-gray-700 hover:bg-gray-700'
                } ${!canCompleteToday ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-800 rounded-full">
                    {action.category === 'Mindset' && <Brain size={16} className="text-orange-500" />}
                    {action.category === 'Sleep' && <Moon size={16} className="text-orange-500" />}
                    {action.category === 'Exercise' && <Activity size={16} className="text-orange-500" />}
                    {action.category === 'Nutrition' && <Apple size={16} className="text-orange-500" />}
                    {action.category === 'Biohacking' && <Database size={16} className="text-orange-500" />}
                    {!['Mindset', 'Sleep', 'Exercise', 'Nutrition', 'Biohacking'].includes(action.category) && 
                      <CheckSquare size={16} className="text-orange-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{action.action_text}</div>
                    <div className="text-xs text-gray-400 mt-1">{action.description}</div>
                    <div className="text-xs text-orange-500 mt-1">{action.category}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    selectedActions.includes(action.id)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-500'
                  }`}>
                    {selectedActions.includes(action.id) && <Check size={14} />}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Selected: <span className="text-white font-medium">{selectedActions.length}</span>
              <span className="text-gray-400"> / 2 required</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedActions.length < 2 || !canCompleteToday || isChallengeFullyCompleted}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Submitting...</span>
                </>
              ) : (
                isChallengeFullyCompleted ? 'Challenge Completed' : 
                canCompleteToday ? 'Complete Day' : 'Already Completed Today'
              )}
            </button>
          </div>
        </div>
        
        <div className="p-4 pt-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Progress: <span className="text-white">{verificationCount} / {verificationRequired} days</span>
            </div>
            <button
              onClick={() => navigate(`/challenge/${challengeId}`, { 
                replace: true,
                state: { fromDaily: true }
              })}
              className="text-sm text-orange-500 hover:text-orange-400"
            >
              View Challenge Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}