import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Ban, CheckCircle2, Zap, Clock, Brain, Moon, Activity, Apple, Database, History } from 'lucide-react';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { QuestCancelConfirm } from './QuestCancelConfirm';
import { CompletedQuestsModal } from './CompletedQuestsModal';
import { useCompletedActivities } from '../../../hooks/useCompletedActivities';
import { useQuestManager } from '../../../hooks/useQuestManager';
import { useChallengeLibrary } from '../../../hooks/useChallengeLibrary';
import { useQuestLibrary } from '../../../hooks/useQuestLibrary';
import { QuestLibrary } from './QuestLibrary';
import { supabase } from '../../../lib/supabase';

interface QuestCardProps {
  userId: string | undefined;
  categoryScores: Record<string, number>;
}

export function QuestCard({ userId, categoryScores }: QuestCardProps) {
  const navigate = useNavigate();
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCompletedQuests, setShowCompletedQuests] = useState(false);
  const { data: completedActivities } = useCompletedActivities(userId);
  const { 
    activeQuest, 
    loading, 
    hasCompletedAnyChallenge,
    startQuest, 
    cancelQuest 
  } = useQuestManager(userId);
  const { quests } = useQuestLibrary();
  const { challenges } = useChallengeLibrary();
  
  // Get quest progress data
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);
  const [nextWeek, setNextWeek] = useState<number>(1);
  const [canCompleteNextWeek, setCanCompleteNextWeek] = useState<boolean>(true);
  const [daysUntilNextWeek, setDaysUntilNextWeek] = useState<number | null>(null);
  const [totalCompletedWeeks, setTotalCompletedWeeks] = useState<number>(0);
  
  useEffect(() => {
    if (!userId || !activeQuest) return;
    
    const fetchQuestProgress = async () => {
      try {
        // Get quest weekly progress
        const { data, error } = await supabase.rpc(
          'get_next_quest_week',
          { 
            p_user_id: userId,
            p_quest_id: activeQuest.quest_id
          }
        );
        
        if (error) throw error;
        
        if (data.success) {
          setNextWeek(data.next_week || 1);
          setCanCompleteNextWeek(data.can_complete_next_week || true);
          setTotalCompletedWeeks(data.total_completed_weeks || 0);
          
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
        }
      } catch (err) {
        console.error('Error fetching quest progress:', err);
      }
    };
    
    fetchQuestProgress();
  }, [userId, activeQuest]);

  const handleCancelQuest = async () => {
    try {
      await cancelQuest();
      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Error canceling quest:', err);
    }
  };

  // Get category icon
  const getCategoryIcon = () => {
    switch(activeQuest?.category?.toLowerCase()) {
      case 'mindset':
        return <Brain className="text-orange-500" size={24} />;
      case 'sleep':
        return <Moon className="text-orange-500" size={24} />;
      case 'exercise':
        return <Activity className="text-orange-500" size={24} />;
      case 'nutrition':
        return <Apple className="text-orange-500" size={24} />;
      case 'biohacking':
        return <Database className="text-orange-500" size={24} />;
      default:
        return <Award className="text-orange-500" size={24} />;
    }
  };

  // Calculate progress based on completed weeks
  const progress = Math.min((totalCompletedWeeks / 12) * 100, 100);

  return (
    <div id="quests" className="space-y-4 scroll-mt-20">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Quests</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {activeQuest ? '1' : '0'}/1 Active
          </span>
          <button
            onClick={() => setShowLibrary(true)}
            className="text-sm text-orange-500 hover:text-orange-400"
          >
            View All
          </button>
        </div>
      </div>

      {activeQuest ? (
        <Card>
          <div 
            onClick={() => navigate(`/quest/${activeQuest.quest_id}`)}
            className="cursor-pointer p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getCategoryIcon()}
                <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{activeQuest.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCancelConfirm(true);
                        }}
                        className="text-gray-500 hover:text-gray-400"
                        title="Cancel Quest"
                      >
                        <Ban size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400">{activeQuest.category}</span>
                    </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Zap size={16} />
                <span className="font-medium">+{activeQuest.fuelPoints} FP</span>
              </div>
            </div>

            <div className="space-y-2">
              <Progress 
                value={progress}
                max={100}
                className="bg-gray-700 h-2"
              />
              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  {activeQuest?.canCompleteNextWeek === true ? (
                    <div className="text-xs bg-lime-500/20 px-2 py-0.5 rounded-full text-lime-500">
                      Weekly Action Available
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs bg-gray-700/80 px-2 py-0.5 rounded-full text-gray-400">
                      <Clock size={12} className="text-gray-400" />
                      <span>Available in {activeQuest?.daysUntilNextWeek || 0} {(activeQuest?.daysUntilNextWeek || 0) === 1 ? 'day' : 'days'}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-lime-500">
                  <CheckCircle2 size={12} />
                  <span>{totalCompletedWeeks || 0}/12 Weeks</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="relative">
          {!hasCompletedAnyChallenge && (
            <div className="text-center text-orange-500 py-4 bg-orange-500/5 rounded-lg mb-4">
              Complete Morning Basics Challenge to unlock all Tier 1 Quests
            </div>
          )}

          <div className="flex flex-col items-center justify-center py-2.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <Award className="text-orange-500" size={24} />
              <h3 className="text-lg font-medium text-white">No Active Quest</h3>
            </div>
            <button
              disabled={!hasCompletedAnyChallenge}
              onClick={() => setShowLibrary(true)}
              className={`flex items-center gap-2 px-3.5 py-1 rounded-lg transition-colors ${
                hasCompletedAnyChallenge 
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Award size={16} />
              {hasCompletedAnyChallenge ? 'Select a Quest' : 'Complete First Challenge'}
            </button>
            <div className="text-xs text-gray-400 mt-1">
              Complete 12 weekly actions to earn +860 FP
            </div>
          </div>
        </Card>
      )}
      
      <div className="my-4 text-xs text-gray-400 italic text-center">
        Unlock More Quests After Completion
      </div>
      
      {/* Completed Quests Section */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Award className="text-orange-500" size={16} />
              <span>Completed Quests ({completedActivities.questsCompleted})</span>
            </h3>
          </div>
          <button
            onClick={() => setShowCompletedQuests(true)}
            className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-400 transition-colors"
          >
            <History size={14} />
            <span>View History</span>
          </button>
        </div>
      </Card>

      {showCompletedQuests && (
        <CompletedQuestsModal
          onClose={() => setShowCompletedQuests(false)}
        />
      )}

      {showLibrary && (
        <QuestLibrary
          userId={userId}
          activeQuestsCount={activeQuest ? 1 : 0}
          categoryScores={categoryScores}
          onStartQuest={startQuest}
          onClose={() => setShowLibrary(false)}
          hasCompletedAnyChallenge={hasCompletedAnyChallenge}
        />
      )}
      
      {showCancelConfirm && (
        <QuestCancelConfirm
          onConfirm={handleCancelQuest}
          onClose={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  );
}