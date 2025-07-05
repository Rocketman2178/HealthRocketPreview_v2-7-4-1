import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, CheckCircle2, X, MessageSquare, Clock } from 'lucide-react';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { getChatPath } from '../../../lib/utils/chat';
import { supabase } from '../../../lib/supabase';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { ChallengeMessageButton } from '../challenge/ChallengeMessageButton';

interface CompletedContest {
  id: string;
  challenge_id: string;
  name: string;
  category: string;
  verification_count: number;
  verifications_required: number;
  all_verifications_completed: boolean;
  started_at: string;
  completed_at: string;
  fuel_points: number;
  duration: number;
}

export function CompletedContestsCard() {
  const [completedContests, setCompletedContests] = useState<CompletedContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useSupabase();

  useEffect(() => {
    const fetchCompletedContests = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Use the RPC function to get completed contests
        const { data, error } = await supabase.rpc('get_user_completed_contests', {
          p_user_id: user.id
        });
        
        if (error) throw error;
        
        if (data?.success) {
          setCompletedContests(data.contests || []);
        } else {
          throw new Error(data?.error || 'Failed to fetch completed contests');
        }
      } catch (err) {
        console.error('Error fetching completed contests:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch completed contests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompletedContests();
    
    // Listen for dashboard updates
    const handleDashboardUpdate = () => {
      fetchCompletedContests();
    };
    
    window.addEventListener('dashboardUpdate', handleDashboardUpdate);
    
    return () => {
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate);
    };
  }, [user]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center py-4 text-red-400">
          <p>Error loading completed contests: {error}</p>
        </div>
      </Card>
    );
  }

  if (completedContests.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center py-8 text-gray-400">
          <Trophy className="mx-auto mb-2" size={24} />
          <p>No completed contests yet</p>
          <p className="text-sm text-gray-500 mt-2">Join contests and complete them to see them here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {completedContests.map((contest) => (
          <div 
            key={contest.id}
            className="bg-gray-700/50 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => navigate(`/challenge/${contest.challenge_id}`)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="text-orange-500" size={20} />
                  <h3 className="font-bold text-white">{contest.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <ChallengeMessageButton challengeId={contest.challenge_id} size={20} hideCount />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3 text-sm">
                <span className="text-gray-400">{contest.category}</span>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-gray-400">{contest.duration} Days</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-gray-400">
                    {new Date(contest.completed_at).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              <Progress 
                value={(contest.verification_count / contest.verifications_required) * 100}
                max={100}
                className="bg-gray-700 h-2 mb-2"
              />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  {contest.all_verifications_completed ? (
                    <div className="flex items-center gap-1 text-lime-500">
                      <CheckCircle2 size={14} />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-orange-500">
                      <X size={14} />
                      <span>Incomplete</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-lime-500">
                  <CheckCircle2 size={14} />
                  <span>{contest.verification_count}/{contest.verifications_required} Verifications</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}