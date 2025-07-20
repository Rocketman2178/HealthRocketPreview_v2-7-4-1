import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Ban, CheckCircle2, Zap, Brain, Moon, Activity, Apple, Database } from 'lucide-react';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { ChallengeCancelConfirm } from './ChallengeCancelConfirm';
import type { Challenge } from '../../../types/dashboard';
import { supabase } from '../../../lib/supabase';

interface ChallengeCardProps {
  userId:string|undefined;
  challenge: Challenge;
  onCancel?: (id: string) => void;
}

export function ChallengeCard({ userId, challenge, onCancel }: ChallengeCardProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const navigate = useNavigate();
  const isMorningBasics = challenge.challenge_id === 'mb0';
  
  // Get category icon
  const getCategoryIcon = () => {
    switch(challenge.category?.toLowerCase()) {
      case 'mindset': return <Brain size={14} className="text-orange-500" />;
      case 'sleep': return <Moon size={14} className="text-orange-500" />;
      case 'exercise': return <Activity size={14} className="text-orange-500" />;
      case 'nutrition': return <Apple size={14} className="text-orange-500" />;
      case 'biohacking': return <Database size={14} className="text-orange-500" />;
      default: return null;
    }
  };

  useEffect(() => {
    // Check if Morning Basics challenge has been completed today
    const checkMorningBasicsCompletion = async () => {
      if (isMorningBasics && userId) {
        try {
          const today = new Date().toISOString().split('T')[0];
          
          // Check if there's a completed action for today
          const { data, error } = await supabase
            .from('completed_actions')
            .select('*')
            .eq('user_id', userId)
            .eq('action_id', 'morning_basics_daily')
            .eq('completed_date', today)
            .maybeSingle();
            
          if (error) throw error;
          
          // Set completed status based on whether we found a record
          setCompletedToday(!!data);
        } catch (err) {
          console.error('Error checking Morning Basics completion:', err);
        }
      }
    };
    
    checkMorningBasicsCompletion();
  }, [userId, isMorningBasics]);
  
  const handleCancel = async () => {
    if (onCancel) {
      await onCancel(challenge.challenge_id);
      window.dispatchEvent(new CustomEvent('challengeCanceled'));
    }
  };

  return (
    <>
      <Card>
        <div 
          onClick={() => {
            // For regular challenges that are already active, go directly to daily form
            if (challenge.status === 'active' && challenge.challenge_id !== 'mb0' && !challenge.category?.includes('Contest')) {
              navigate(`/challenge/${challenge.challenge_id}/daily`, {
                replace: true,
                state: { fromChallenge: true }
              });
            } else {
              navigate(`/challenge/${challenge.challenge_id}`, {
                replace: true,
                state: { fromChallenge: true }
              });
            }
          }}
          className="cursor-pointer p-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Award className="text-orange-500" size={24} />
              <div className="min-w-0">
                <h3 className="font-bold text-white truncate">{challenge.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {challenge.category && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {getCategoryIcon()}
                      <span>{challenge.category}</span>
                    </div>
                  )}
                  {challenge.expertReference && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-xs text-orange-500 truncate max-w-[150px]">
                        <Award size={12} />
                        <span className="truncate">{challenge.expertReference}</span>
                      </div>
                    </>
                  )}
                  {onCancel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCancelConfirm(true);
                      }}
                      className="text-gray-500 hover:text-gray-400 ml-auto"
                      title="Cancel Challenge"
                    >
                      <Ban size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-orange-500">
              <Zap size={16} />
              <span className="font-medium">+{challenge.fuelPoints} FP</span>
            </div>
          </div>

          <div className="space-y-2">
            <Progress 
              value={challenge.progress}
              max={100}
              className="bg-gray-700 h-2"
            />
            <div className="flex justify-between">
              {isMorningBasics && (
                <div className="flex items-center">
                  {completedToday ? (
                    <div className="w-5 h-5 rounded-full bg-lime-500 flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-white" />
                    </div>
                  ) : (
                    <div className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full">
                      Available
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1 text-lime-500 ml-auto">
                <CheckCircle2 size={12} />
                <span>
                  {isMorningBasics ? (
                    `${challenge.verification_count || 0}/21 Complete`
                  ) : (
                    `${challenge.verification_count || 0}/${challenge.verifications_required || 21} Days`
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {showCancelConfirm && (
        <ChallengeCancelConfirm
          onConfirm={handleCancel}
          onClose={() => setShowCancelConfirm(false)}
        />
      )}
    </>
  );
}