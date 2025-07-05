import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Zap, Ban, Users, Trophy, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { getChatPath } from '../../../lib/utils/chat';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { ChallengeMessageButton } from '../challenge/ChallengeMessageButton';
import { ChallengeCancelConfirm } from '../challenge/ChallengeCancelConfirm'; 
import type { Challenge } from '../../../types/dashboard';
import { supabase } from '../../../lib/supabase';
import { ChallengePlayerList } from '../../chat/ChallengePlayerList';
import type { LeaderboardEntry } from '../../../types/community';

interface ContestCardProps {
  userId: string | undefined;
  contest: Challenge;
  onCancel?: (id: string) => void;
}

export function ContestCard({ userId, contest, onCancel }: ContestCardProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const navigate = useNavigate();
  
  // Get start date from the database
  const [contestStartDate, setContestStartDate] = useState<Date | null>(
    contest.start_date ? new Date(contest.start_date) : null
  );
  
  // Fetch the latest start date from the database
  useEffect(() => {
    const fetchContestStartDate = async () => {
      if (!contest.challenge_id) return;
      
      try {
        const { data, error } = await supabase
          .from('contests')
          .select('start_date')
          .eq('challenge_id', contest.challenge_id)
          .maybeSingle();
          
        if (!error && data?.start_date) {
          setContestStartDate(new Date(data.start_date));
        }
      } catch (err) {
        console.error('Error fetching contest start date:', err);
      }
    };
    
    fetchContestStartDate();
  }, [contest.challenge_id]);
  
  const registrationEndDate = contest.registrationEndDate ? new Date(contest.registrationEndDate) : null;
    
  // Check if the contest has actually started based on the start date
  const now = new Date();
  const hasStarted = contestStartDate ? contestStartDate <= now : true;
  
  // Check if registration is still open
  const isRegistrationOpen = registrationEndDate ? registrationEndDate > now : true;
  
  // Use the status from the database, or calculate it based on start date
  const status = contest.status || (contestStartDate && contestStartDate > now ? 'pending' : 'active');
  const isPending = status === 'pending';
  const isFutureContest = contestStartDate && contestStartDate > now;

  // Get appropriate days display text
  const getDaysDisplay = () => {
    if (contestStartDate && contestStartDate > now) {
      // If we have explicit days until start from the database, use that
      if (contest.daysUntilStart !== undefined && contest.daysUntilStart !== null) {
        return `${contest.daysUntilStart} Days Until Start`;
      } else {
        // Otherwise calculate from start date
        const now = new Date(); 
        const daysUntilStart = Math.ceil((contestStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `${daysUntilStart} Days Until Start`;
      }
    }
    
    // For active contests or fallback
    return `${contest.daysRemaining} Days Left`;
  };

  useEffect(() => {
    // Empty useEffect - removed boost handling
  }, []);

  // Fetch active players
  useEffect(() => {
    const fetchActivePlayers = async () => {
      try {
        const { data: count, error } = await supabase.rpc(
          'get_contest_players_count',
          { p_challenge_id: contest.challenge_id }
        );

        if (error) throw error;
        setPlayerCount(count || 0);
      } catch (err) {
        console.error('Error fetching players:', err);
      }
    };

    fetchActivePlayers();
  }, [contest.challenge_id]);

  useEffect(() => {
    // Empty useEffect - removed boost handling
  }, []);

  // Fetch active players
  useEffect(() => {
    const fetchActivePlayers = async () => {
      try {
        // Get player count
        const { data: count, error } = await supabase.rpc('get_contest_players_count', {
          p_challenge_id: contest.challenge_id
        });

        if (error) throw error;
        setPlayerCount(count || 0);
        
        // Get player list
        const { data: playerData, error: playerError } = await supabase.rpc('get_contest_players', {
          p_challenge_id: contest.challenge_id
        });
        
        if (playerError) throw playerError;
        
        if (playerData) {
          // Map to LeaderboardEntry format
          const mappedPlayers: LeaderboardEntry[] = playerData.map((player: any) => ({
            userId: player.user_id,
            name: player.name || 'Unknown Player',
            avatarUrl: player.avatar_url,
            level: player.level || 1,
            plan: player.plan || 'Free Plan',
            healthScore: Number(player.health_score) || 7.8,
            healthspanYears: Number(player.healthspan_years) || 0,
            createdAt: player.created_at || new Date().toISOString(),
            rank: 0,
            fuelPoints: 0,
            burnStreak: player.burn_streak || 0
          }));
          
          setPlayers(mappedPlayers);
        }
      } catch (err) {
        console.error('Error fetching players:', err);
      }
    };

    fetchActivePlayers();
  }, [contest.challenge_id]);

  const handleCancel = async () => {
    if (onCancel) {
      await onCancel(contest.challenge_id);
      window.dispatchEvent(new CustomEvent('contestCanceled'));
    }
  };

  // Calculate progress based on verification count
  const verificationProgress = Math.min(
    ((contest.verification_count || 0) / (contest.verifications_required || 8)) * 100,
    100
  );

  return (
    <>
      <Card>
        <div 
          onClick={() => {
            // Set active tab to contests before navigating
            window.dispatchEvent(new CustomEvent('setActiveTab', { detail: { tab: 'contests' } }));
            setTimeout(() => {
              navigate(`/challenge/${contest.challenge_id}`);
            }, 50);
          }}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Trophy className="text-orange-500" size={24} />
              <div className="min-w-0">
                <h3 className="font-bold text-white truncate">{contest.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded ${contest.entryFee ? 'bg-orange-500/10 text-orange-500' : 'bg-lime-500/10 text-lime-500'}`}>
                    {contest.entryFee ? `Entry Fee: 1 Credit` : 'Free Entry'}
                  </span>
                  <span className="text-xs text-orange-500">+{contest.fuelPoints} FP</span>
                  {isPending ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-500">
                      Pending
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-lime-500/20 text-lime-500">
                      Active
                    </span>
                  )}
                 {isRegistrationOpen && hasStarted && (
                   <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                     Registration Open
                   </span>
                 )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChallengeMessageButton challengeId={contest.challenge_id} size={24} hideCount />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{contest.relatedCategories?.[0] || contest.category}</span>
                <span className="text-gray-400 mx-1">•</span>
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-gray-400">{contest.duration || 7} Days</span>
                </div>
                {contestStartDate && (
                  <>
                    <span className="text-gray-400 mx-1">•</span>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-400">
                        {contestStartDate.toLocaleDateString('en-US', {
                          year: 'numeric', 
                          month: 'numeric', 
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </>
                )}
               {registrationEndDate && (
                 <>
                   <span className="text-gray-400 mx-1">•</span>
                   <div className="flex items-center gap-1">
                     <Calendar size={12} className="text-gray-400" />
                     <span className="text-gray-400">
                       Reg. Ends: {registrationEndDate.toLocaleDateString('en-US', {
                         month: 'numeric',
                         day: 'numeric'
                       })}
                     </span>
                   </div>
                 </>
               )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(getChatPath(contest.challenge_id));
                  }}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Users size={14} />
                  <span>{playerCount} Players</span>
                </button>
              </div>
            </div>
            <Progress 
              value={verificationProgress}
              max={100}
              className="bg-gray-700 h-2"
            />
            <div className="flex justify-between text-xs mt-1">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 text-lime-500">
                  <CheckCircle2 size={12} />
                  <span>{contest.verification_count || 0}/{contest.verifications_required || 8} Verifications</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-500 font-medium">{getDaysDisplay()}</span>
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
      
      {showPlayerList && (
        <ChallengePlayerList
          players={players}
          loading={false}
          onClose={() => setShowPlayerList(false)}
          isContest={true}
        />
      )}
    </>
  );
}