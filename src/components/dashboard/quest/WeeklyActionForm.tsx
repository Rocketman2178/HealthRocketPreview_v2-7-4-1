import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, Target, Zap, ChevronRight, Calendar, Award, Clock, AlertTriangle } from 'lucide-react';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { FPCongrats } from '../../ui/fp-congrats';
import { supabase } from '../../../lib/supabase';

interface WeeklyAction {
  title: string;
  description: string;
  expertReference: {
    name: string;
    expertise: string;
  };
}

export function WeeklyActionForm() {
  const navigate = useNavigate();
  const { questId } = useParams<{ questId: string }>();
  const { user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questData, setQuestData] = useState<any>(null);
  const [weeklyActions, setWeeklyActions] = useState<WeeklyAction[]>([]);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [totalCompletedWeeks, setTotalCompletedWeeks] = useState<number>(0);
  const [canCompleteNextWeek, setCanCompleteNextWeek] = useState<boolean>(true);
  const [daysUntilNextWeek, setDaysUntilNextWeek] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fpEarned, setFpEarned] = useState<number>(0);
  const [showFPCongrats, setShowFPCongrats] = useState(false);
  const [isQuestCompleted, setIsQuestCompleted] = useState(false);
  const [lastCompletionDate, setLastCompletionDate] = useState<string | null>(null);
  useEffect(() => {
    if (!questId  || !user) {
      navigate('/', { replace: true });
      return;
    }

    const fetchQuestData = async () => {
      try {
        setLoading(true);
        
        // Get quest weekly progress
        const { data, error } = await supabase.rpc(
          'get_user_quest_weekly_progress',
          { 
            p_user_id: user.id,
            p_quest_id: questId 
          }
        );
        
        if (error) throw error;
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load quest data');
        }
        
        setQuestData(data.quest);
        setWeeklyActions(data.quest.weekly_actions || []);
        setTotalCompletedWeeks(data.weekly_progress?.length || 0);
        const nextWeekNumber = data.next_week || 1;
        setWeekNumber(nextWeekNumber);
        // Explicitly set canCompleteNextWeek based on the value from the server
        setCanCompleteNextWeek(data.can_complete_next_week === true); // Strict equality check
        setLastCompletionDate(data.last_completion_date || null);
        
        // Calculate days until next week is available
        if (data.last_completion_date && !data.can_complete_next_week) {
          const lastCompletionDate = new Date(data.last_completion_date);
          const nextAvailableDate = new Date(lastCompletionDate);
          nextAvailableDate.setDate(nextAvailableDate.getDate() + 7);
          
          const now = new Date();
          const diffTime = nextAvailableDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setDaysUntilNextWeek(Math.max(0, diffDays));
          setCanCompleteNextWeek(false); // Force to false when in cooldown period
        }
        
        // Additional check: if we have a last completion date, verify 7-day cooldown
        if (data.last_completion_date) {
          const lastCompletionDate = new Date(data.last_completion_date);
          const now = new Date();
          const diffTime = now.getTime() - lastCompletionDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 7) {
            setCanCompleteNextWeek(false); // Force to false during 7-day cooldown
            setDaysUntilNextWeek(7 - diffDays);
          }
        }
      } catch (err) {
        console.error('Error fetching quest data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quest data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestData();
  }, [questId , user, navigate]);
  
  const handleSubmit = async () => {
    if (!user || !questId  || selectedActionIndex === null) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Complete weekly action
      const { data, error } = await supabase.rpc(
        'complete_quest_weekly_action',
        {
          p_user_id: user.id,
          p_quest_id: questId ,
          p_week_number: weekNumber,
          p_selected_action_index: selectedActionIndex
        }
      );
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to complete weekly action');
      }
      
      // Set success state
      setSuccess(true);
      setShowFPCongrats(true);
      setFpEarned(data.fp_earned || 30);
      setIsQuestCompleted(data.is_quest_completed || false);
      setTotalCompletedWeeks(data.total_completed_weeks || 0);
      
      // Trigger dashboard update
      window.dispatchEvent(new CustomEvent('dashboardUpdate', {
        detail: {
          fpEarned: data.fp_earned,
          updatedPart: data.is_quest_completed ? 'quest' : 'boost',
          category: 'general',
          questCompleted: data.is_quest_completed
        }
      }));
    } catch (err) {
      console.error('Error completing weekly action:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete weekly action');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle closing the FP Congrats modal
  const handleCloseFPCongrats = () => {
    setShowFPCongrats(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        <p className="text-white mt-4">Loading quest data...</p>
      </div>
    );
  }
  
  // Show FP Congrats modal if success and showFPCongrats is true
  if (showFPCongrats && fpEarned) {
    return (
      <FPCongrats 
        fpEarned={fpEarned} 
        category={isQuestCompleted ? "quest" : "weekly"} 
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
            {isQuestCompleted ? 'Quest Completed!' : 'Weekly Action Completed!'}
          </h3>
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-orange-500">
            <Zap size={24} />
            <span>+{fpEarned} FP</span>
          </div>
          
          {isQuestCompleted ? (
            <p className="text-gray-300">
              Congratulations! You've completed all 12 weeks of this quest.
            </p>
          ) : (
            <p className="text-gray-300">
              You've completed {totalCompletedWeeks} of 12 weeks.
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

  // If user can't complete next week yet, show waiting screen
  if (!canCompleteNextWeek) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
            <Clock className="text-orange-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Weekly Action Cooldown</h3>
          <p className="text-gray-300">
            You need to wait {daysUntilNextWeek} more {daysUntilNextWeek === 1 ? 'day' : 'days'} before you can complete your next weekly action.
          </p>
          <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Progress:</span>
              <span className="text-orange-500 font-medium">{totalCompletedWeeks} / 12 weeks</span>
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
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{questData?.name || 'Quest Weekly Action'}</h2>
          <button
            onClick={() => navigate('/', { 
              replace: true, 
              state: { fromWeekly: true }
            })}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Week {weekNumber} of 12</h3>
            <div className="flex items-center gap-2 text-orange-500">
              <Zap size={16} className="animate-pulse" />
              <span>+{questData?.weekly_fp_reward || 30} FP Reward</span>
            </div>
          </div>
          
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Target className="text-orange-500" size={20} />
              <h3 className="text-lg font-medium text-white">Week {weekNumber}: Select One Action to Focus On</h3>
            </div>
            <p className="text-sm text-gray-300 mb-2">
              Choose one action to focus on this week. You'll earn +{questData?.weekly_fp_reward || 30} FP when you mark it complete.
            </p>
            <p className="text-sm text-gray-300">
              Complete all 12 weeks to earn a +{questData?.completion_fp_reward || 500} FP bonus!
            </p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            {weeklyActions.map((action: WeeklyAction, index: number) => (
              <div 
                key={index}
                onClick={() => setSelectedActionIndex(index)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedActionIndex === index 
                    ? 'bg-orange-500/20 border border-orange-500/50' 
                    : 'bg-gray-700/50 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                    selectedActionIndex === index 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {selectedActionIndex === index ? (
                      <Check size={14} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{action.title}</h4>
                    <p className="text-sm text-gray-300 mt-1">{action.description}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Award size={14} className="text-orange-500" />
                      <div className="text-xs text-orange-500">
                        <span className="font-medium">{action.expertReference.name}</span>
                        <span className="text-gray-400 ml-1">- {action.expertReference.expertise}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400">
                Week {weekNumber} of 12 • {totalCompletedWeeks} completed
              </span>
            </div>
            
            {canCompleteNextWeek ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedActionIndex === null}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  submitting || selectedActionIndex === null
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Week {weekNumber}</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            ) : (
              <button
                disabled={true}
                className="px-4 py-2 rounded-lg bg-gray-700/90 text-gray-500 cursor-not-allowed opacity-70 flex items-center gap-2"
              >
                <Clock size={16} className="text-gray-500" />
                <span>
                  {daysUntilNextWeek !== null 
                    ? `Available in ${daysUntilNextWeek} ${daysUntilNextWeek === 1 ? 'day' : 'days'}`
                    : 'Not Available Yet'
                  }
                </span>
              </button>
            )}
          </div>
          
          {!canCompleteNextWeek && daysUntilNextWeek !== null && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-orange-500">
                <Clock size={16} />
                <span className="font-medium">Weekly Action Cooldown Active</span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                You must wait 7 days between weekly actions. Your next action will be available in {daysUntilNextWeek} {daysUntilNextWeek === 1 ? 'day' : 'days'}.
              </p>
              {lastCompletionDate && (
                <p className="text-xs text-gray-400 mt-2">
                  Last completed: {new Date(lastCompletionDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}