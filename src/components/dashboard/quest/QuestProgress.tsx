import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Target, Zap, CheckCircle2, Calendar, X, Award, Ban, ChevronRight, Clock, Brain, Moon, Activity, Apple, Database } from 'lucide-react';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { supabase } from '../../../lib/supabase'; 
import { Progress } from '../../ui/progress';
import { QuestCancelConfirm } from './QuestCancelConfirm';

export function QuestProgress() {
  const navigate = useNavigate();
  const { questId } = useParams<{ questId: string }>();
  const { user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [questData, setQuestData] = useState<any>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);
  const [weeklyActions, setWeeklyActions] = useState<any[]>([]);
  const [nextWeek, setNextWeek] = useState<number>(1);
  const [canCompleteNextWeek, setCanCompleteNextWeek] = useState<boolean>(true);
  const [daysUntilNextWeek, setDaysUntilNextWeek] = useState<number | null>(null);
  const [totalCompletedWeeks, setTotalCompletedWeeks] = useState<number>(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get category icon
  const getCategoryIcon = () => {
    switch(questData?.category?.toLowerCase()) {
      case 'mindset':
        return <Brain size={20} className="text-orange-500" />;
      case 'sleep':
        return <Moon size={20} className="text-orange-500" />;
      case 'exercise':
        return <Activity size={20} className="text-orange-500" />;
      case 'nutrition':
        return <Apple size={20} className="text-orange-500" />;
      case 'biohacking':
        return <Database size={20} className="text-orange-500" />;
      default:
        return <Target size={20} className="text-orange-500" />;
    }
  };

  useEffect(() => {
    if (!questId || !user) {
      navigate('/', { replace: true });
      return;
    }

    const fetchQuestProgress = async () => {
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
        setWeeklyProgress(data.weekly_progress || []);
        setNextWeek(data.next_week || 1);
        setCanCompleteNextWeek(data.can_complete_next_week || true);
        setTotalCompletedWeeks(data.weekly_progress?.length || 0);
        
        // Calculate days until next week is available
        if (data.last_completion_date && !data.can_complete_next_week) {
          const lastCompletionDate = new Date(data.last_completion_date);
          const nextAvailableDate = new Date(lastCompletionDate);
          nextAvailableDate.setDate(nextAvailableDate.getDate() + 7);
          
          const now = new Date();
          const diffTime = nextAvailableDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setDaysUntilNextWeek(Math.max(0, diffDays));
        }
      } catch (err) {
        console.error('Error fetching quest progress:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quest data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestProgress();
  }, [questId, user, navigate]);

  const handleCancel = async () => {
    if (!user || !questId) return;
    
    try {
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('user_id', user.id)
        .eq('quest_id', questId);
        
      if (error) throw error;
      
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error canceling quest:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel quest');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        <p className="text-white mt-4">Loading quest progress...</p>
      </div>
    );
  }

  if (!questData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Quest Not Found</h2>
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
          <div className="flex items-center gap-3">
            {getCategoryIcon()}
            <div>
              <h2 className="text-xl font-bold text-white">{questData.name}</h2>
              <div className="text-sm text-gray-400">{questData.category}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-gray-400 hover:text-red-400 transition-colors"
              title="Cancel Quest"
            >
              <Ban size={20} />
            </button>
            <button
              onClick={() => navigate('/', { 
                replace: true,
                state: { fromQuest: true }
              })}
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
                {totalCompletedWeeks}/12 Weeks
              </div>
            </div>
            <Progress 
              value={(totalCompletedWeeks / 12) * 100}
              max={100}
              className="bg-gray-700 h-2 mb-2"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <div>
                {totalCompletedWeeks === 0 ? 'Not started' : `${totalCompletedWeeks} weeks completed`}
              </div>
              <div>
                {((totalCompletedWeeks / 12) * 100).toFixed(0)}% Complete
              </div>
            </div>
          </div>

          {/* Weekly Action Button */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="text-orange-500" size={20} />
                <div>
                  <h3 className="text-white font-medium">Weekly Action</h3>
                  <p className="text-sm text-gray-300">Complete one action each week for 12 weeks</p>
                  {!canCompleteNextWeek && daysUntilNextWeek !== null && (
                    <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                      <Clock size={12} />
                      <span>Available in {daysUntilNextWeek} {daysUntilNextWeek === 1 ? 'day' : 'days'}</span>
                    </div>
                  )}
                  {!canCompleteNextWeek && daysUntilNextWeek !== null && (
                    <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                      <Clock size={12} />
                      <span>Available in {daysUntilNextWeek} {daysUntilNextWeek === 1 ? 'day' : 'days'}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/quest/${questId}/weekly`)}
                disabled={!canCompleteNextWeek}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  !canCompleteNextWeek 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-orange-500 text-white hover:bg-orange-600 transition-colors'
                }`}
              >
                {canCompleteNextWeek ? (
                  <>
                    <span>Complete Week {nextWeek}</span>
                    <ChevronRight size={16} />
                  </> 
                ) : (
                  <>
                    <Clock size={16} className="text-gray-500" />
                    <span>Cooldown: {daysUntilNextWeek} {daysUntilNextWeek === 1 ? 'day' : 'days'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Completed Weeks */}
          {weeklyProgress.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Completed Weeks</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {weeklyProgress.map((week, index) => {
                  const action = weeklyActions[week.selected_action_index];
                  return (
                    <div key={week.id} className="bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={14} className="text-white" />
                          </div>
                          <span className="text-white font-medium">Week {week.week_number}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(week.completion_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      
                      <div className="ml-8">
                        <p className="text-sm text-gray-300">{action?.title || 'Weekly Action'}</p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Award size={12} className="text-orange-500" />
                          <span className="text-xs text-orange-500">{action?.expertReference?.name || 'Expert'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-2 text-xs text-lime-500">
                          <Zap size={12} />
                          <span>+{week.fp_earned} FP earned</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quest Description */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-2">Quest Description</h3>
            <p className="text-sm text-gray-300 mb-4">{questData.description}</p>
            
            {/* Expert Reference */}
            {questData.expert_ids && questData.expert_ids.length > 0 && (
              <div className="pt-4 border-t border-gray-600/50">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Award size={16} className="text-orange-500" />
                  <span>Expert References</span>
                </h4>
                <div className="text-sm text-gray-300">
                  {questData.expert_ids.join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Requirements</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-orange-500 mt-1 shrink-0" />
                <span className="text-gray-300">Complete 12 Weekly Actions (one per week)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-orange-500 mt-1 shrink-0" />
                <span className="text-gray-300">Each week, select one action to focus on</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-orange-500 mt-1 shrink-0" />
                <span className="text-gray-300">Earn +30 FP for each weekly action completed</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-orange-500 mt-1 shrink-0" />
                <span className="text-gray-300">Earn +500 FP bonus upon completing all 12 weeks</span>
              </li>
            </ul>
          </div>

          {/* Rewards */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
              <Zap className="text-orange-500" size={20} />
              <span>Rewards</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Weekly Completion:</span>
                <span className="text-orange-500 font-medium">+{questData.weekly_fp_reward} FP</span>
                <span className="text-xs text-gray-400 ml-2">(per weekly action)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Quest Completion:</span>
                <span className="text-orange-500 font-medium">+{questData.completion_fp_reward} FP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Potential:</span>
                <span className="text-orange-500 font-medium">
                  +{questData.weekly_fp_reward * 12 + questData.completion_fp_reward} FP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <QuestCancelConfirm
          onConfirm={handleCancel}
          onClose={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  );
}