import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { isContestChatId } from '../../../lib/utils/chat';
import { ChallengePlayerList } from '../../chat/ChallengePlayerList';
import type { LeaderboardEntry } from '../../../types/community';

interface ChallengeMessageButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  challengeId: string;
  size?: number;
  hideCount?: boolean;
}

export function ChallengeMessageButton({ challengeId, size = 16, hideCount = false, ...props }: ChallengeMessageButtonProps) {
  // Only show for contest challenges
  if (!isContestChatId(challengeId)) {
    return null;
  }
  
  const [playerCount, setPlayerCount] = useState(0);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [contestStartDate, setContestStartDate] = useState<Date | null>(null);
  const [hasStarted, setHasStarted] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContestData = async () => {
      // Use the new function to get player count
      const { data: countData, error: countError } = await supabase.rpc(
        'get_contest_players_count',
        { p_challenge_id: challengeId }
      );
      
      if (!countError) {
        setPlayerCount(countData || 0);
      }
      
      // Check if this is a contest and get its start date
      if (challengeId.startsWith('cn_') || challengeId.startsWith('tc_')) {
        const { data, error } = await supabase.rpc(
          'get_contest_days_info',
          { p_challenge_id: challengeId }
        );
          
        if (!error && data?.success) {
          if (data.start_date) {
            setContestStartDate(new Date(data.start_date));
          }
          setHasStarted(data.has_started);
        }
      }
    };

    fetchContestData();
  }, [challengeId]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (hasStarted) {
      // If contest has started, navigate to chat
      navigate(`/chat/${challengeId}`);
    } else {
      // If contest hasn't started, toggle player list
      setShowPlayerList(!showPlayerList);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`relative p-2 text-white transition-colors rounded-lg hover:bg-gray-700/50 flex items-center gap-2 ${
          hasStarted ? 'ring-1 ring-orange-500' : 'ring-1 ring-gray-600'
        }`}
        {...props}
      >
        {hasStarted ? (
          <MessageCircle size={size} className="text-white" />
        ) : (
          <Clock size={size} className="text-gray-400" />
        )}
        {!hideCount && <span className="text-sm">{playerCount || 0} Players</span>}
        
        {!hasStarted && contestStartDate && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity z-10">
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>Starts {contestStartDate.toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </button>
      
      {showPlayerList && !hasStarted && (
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