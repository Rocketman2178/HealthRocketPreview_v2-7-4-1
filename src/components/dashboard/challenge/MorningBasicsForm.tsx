import React, { useState, useEffect } from 'react';
import { Brain, Moon, Activity, Apple, Database, Check, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { Zap, Trophy } from 'lucide-react';

interface MorningBasicsFormProps {
  challengeId: string;
  onCompleted: () => void;
  onClose: () => void;
}

interface MorningAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
}

export function MorningBasicsForm({ challengeId, onCompleted, onClose }: MorningBasicsFormProps) {
  const { user } = useSupabase();
  const [actions, setActions] = useState<MorningAction[]>([
    {
      id: 'mindset',
      name: 'Mindset',
      description: '2-minute gratitude reflection',
      icon: <Brain className="text-orange-500" size={20} />,
      selected: false
    },
    {
      id: 'sleep',
      name: 'Sleep',
      description: 'Record total sleep time or sleep quality score',
      icon: <Moon className="text-orange-500" size={20} />,
      selected: false
    },
    {
      id: 'exercise',
      name: 'Exercise',
      description: '5-minute stretch',
      icon: <Activity className="text-orange-500" size={20} />,
      selected: false
    },
    {
      id: 'nutrition',
      name: 'Nutrition',
      description: 'Glass of water',
      icon: <Apple className="text-orange-500" size={20} />,
      selected: false
    },
    {
      id: 'biohacking',
      name: 'Biohacking',
      description: '5 minutes of morning sunlight exposure',
      icon: <Database className="text-orange-500" size={20} />,
      selected: false
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canCompleteToday, setCanCompleteToday] = useState<boolean>(true);
  const [daysCompleted, setDaysCompleted] = useState(0);
  
  // Check if challenge exists and can be completed today
  useEffect(() => {
    const checkChallengeStatus = async () => {
      if (!user) return;
      
      try {
        // Check if challenge exists for user
        const { data: challengeExists, error: challengeError } = await supabase
          .from('challenges')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('challenge_id', challengeId)
          .maybeSingle();

        if (challengeError) {
          console.error("Error checking challenge existence:", challengeError);
        }


        // Check if user can complete today (hasn't completed today already)
        const today = new Date().toISOString().split('T')[0];
        // Check completed_actions table instead of completed_boosts
        const { data: todayCompletion, error: todayError } = await supabase
          .from('completed_actions')
          .select('id')
          .eq('user_id', user.id)
          .eq('action_id', 'morning_basics_daily')
          .eq('completed_date', today)
          .maybeSingle();

        if (todayError) {
          console.error("Error checking today's completion:", todayError);
        }

        const challengeData = {
          exists: !!challengeExists,
          challenge_id: challengeExists?.id || null,
          days_completed: challengeExists?.verification_count || 0, // Use verification_count from challenges table
          can_complete_today: !todayCompletion,
          status: challengeExists?.status || null
        };

        console.log("Challenge data received:", challengeData);
        // Set days completed from the response
        const completedDays = challengeData.days_completed || 0;
        setDaysCompleted(completedDays);
        
        // Determine if user can complete today's actions
        // If challenge_id exists but can_complete_today is false, they've already completed today
        // If challenge_id doesn't exist, they haven't started the challenge yet and should be able to complete
        const canComplete = challengeData.challenge_id 
          ? challengeData.can_complete_today 
          : true;
          
        console.log("Can complete today:", canComplete);
        setCanCompleteToday(canComplete);
        
        // Redirect if challenge doesn't exist
        if (!challengeData.exists) {
          onClose();
        }
      } catch (err) {
        console.error('Error checking challenge status:', err);
        setError('Failed to check challenge status');
      }
    };
    
    checkChallengeStatus();
  }, [user, challengeId]);
  
  const handleToggleAction = (id: string) => {
    setActions(prev => 
      prev.map(action => 
        action.id === id 
          ? { ...action, selected: !action.selected } 
          : action
      )
    );
  };
  
  const selectedCount = actions.filter(action => action.selected).length;
  
  const handleSubmit = async () => {
    if (!user) return;
    
    setError(null);
    try {
      setLoading(true);
      
      // Call the handle_morning_basics_completion function
      // This function doesn't need any parameters - it uses auth.uid() internally
      const { data, error: rpcError } = await supabase.rpc('handle_morning_basics_completion');
      
      if (rpcError) throw rpcError;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to complete actions');
      }
      
      console.log("Morning Basics completion successful:", data);
      
      // Get the FP earned from the response
      const fpEarned = data?.fp_earned || 5;
     const challengeCompleted = data?.challenge_completed || false;
      
      setSuccess(true);
     setDaysCompleted(prev => prev + 1);
      
      // Trigger dashboard update
      window.dispatchEvent(new CustomEvent('dashboardUpdate', {
        detail: {
          fpEarned: fpEarned,
          updatedPart: 'challenge',
         category: 'general',
         challengeCompleted: challengeCompleted,
         hasCompletedTier0: true
        }
      }));
      
      // Trigger FP Congrats screen
      window.dispatchEvent(new CustomEvent('dashboardUpdate', {
        detail: {
          fpEarned: fpEarned,
          updatedPart: 'boost',
         category: 'general',
         challengeCompleted: challengeCompleted,
         hasCompletedTier0: true
        }
      }));
      
      // Notify parent component
      setTimeout(() => {
        onCompleted();
      }, 2000);
      
    } catch (err) {
      console.error('Error completing morning actions:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete actions');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 bg-lime-500/20 rounded-full flex items-center justify-center mb-4">
            <Check className="text-lime-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Day Completed! <span className="text-orange-500">+5 FP</span></h3>
          <p className="text-gray-300 mb-4">
            You've completed {daysCompleted + 1} of 21 days for the Morning Basics Challenge.
          </p>
         {(daysCompleted + 1 >= 21 || daysCompleted >= 21) && (
            <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="text-lime-500" size={16} />
                <div>
                  <span className="text-white font-medium">Challenge Complete! </span>
                  <span className="text-lime-500 font-medium">+50 FP Bonus!</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
  
  if (!canCompleteToday) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
            <Check className="text-orange-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Already Completed Today <span className="text-orange-500">(+5 FP)</span></h3>
          <p className="text-gray-300 mb-4">
            You've already completed your Morning Basics actions for today. Come back tomorrow to continue your streak!
          </p>
          <div className="text-sm text-gray-400 mb-4">
            {daysCompleted} of 21 days completed
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
      
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <Zap className="text-orange-500" size={16} />
          <div>
            <span className="text-white font-medium">Daily Reward: </span>
            <span className="text-orange-500 font-medium">+5 FP</span>
            <p className="text-xs text-gray-300 mt-1">Complete the challenge for 21 days to earn +50 FP bonus!</p>
          </div>
        </div>
      </div>
      
      <p className="text-gray-300 mb-6">
        Select at least 3 of the following morning actions that you've completed within 2 hours of waking up today.
      </p>
      
      <div className="space-y-3 mb-6">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => handleToggleAction(action.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              action.selected 
                ? 'bg-orange-500/20 border border-orange-500/50' 
                : 'bg-gray-700/50 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            <div className="p-2 bg-gray-800 rounded-full">
              {action.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="text-white font-medium">{action.name}</div>
              <div className="text-sm text-gray-400">{action.description}</div>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              action.selected 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-700 text-gray-500'
            }`}>
              {action.selected && <Check size={14} />}
            </div>
          </button>
        ))}
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm mb-4">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {selectedCount}/3 actions selected
          <span className="ml-2 text-orange-500 font-medium">+5 FP reward</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || selectedCount < 3}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Complete Day'}
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Day {daysCompleted + 1} of 21
      </div>
    </div>
  );
}