import React, { useState, useEffect } from 'react';
import { Gift, Calendar, Award, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';

interface PrizePoint {
  id: string;
  prize_slot: number;
  prize_points: number;
  tier: string;
  total_fp: number;
  rank: number;
  month: number;
  year: number;
  award_date: string;
  redemption_quarter: string;
}

export function PrizePointsCard() {
  const [prizePoints, setPrizePoints] = useState<PrizePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { user } = useSupabase();

  useEffect(() => {
    const fetchPrizePoints = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase.rpc('get_user_prize_points', {
          p_user_id: user.id
        });
        
        if (error) throw error;
        
        if (data?.success) {
          setPrizePoints(data.prize_points || []);
        } else {
          throw new Error(data?.error || 'Failed to fetch prize points');
        }
      } catch (err) {
        console.error('Error fetching prize points:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch prize points');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrizePoints();
  }, [user]);

  // Calculate total prize points
  const totalPrizePoints = prizePoints.reduce((sum, pp) => sum + pp.prize_points, 0);
  
  // Get month name from month number
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  return (
    <Card className="bg-gray-800/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Gift className="text-orange-500" size={20} />
          <h3 className="text-lg font-semibold text-white">Prize Points</h3>
        </div>
        {prizePoints.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-300"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-400 mb-4">
        Prize Points are won in a randomized drawing each month based on your monthly leaderboard status. 
        Prize Points can be redeemed at the end of each Quarter for prizes from Health Rocket Health & Wellness Partners.
      </p>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm py-2">{error}</div>
      ) : prizePoints.length === 0 ? (
        <div className="text-center py-4">
          <Trophy className="text-orange-500 mx-auto mb-2" size={24} />
          <p className="text-gray-400">No prize points earned yet</p>
          <p className="text-xs text-gray-500 mt-1">Reach Hero or Legend status to earn Prize Points</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-700/50 p-3 rounded-lg mb-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Total Prize Points:</span>
              <span className="text-orange-500 font-medium">{totalPrizePoints}</span>
            </div>
          </div>
          
          {expanded && (
            <div className="space-y-3 mt-4">
              <div className="text-xs text-gray-400 uppercase font-medium">Prize Points History</div>
              {prizePoints.map((prizePoint) => (
                <div key={prizePoint.id} className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-orange-500" />
                      <span className="text-white font-medium">
                        {getMonthName(prizePoint.month)} {prizePoint.year}
                      </span>
                    </div>
                    <span className="text-orange-500 font-medium">+{prizePoint.prize_points} Points</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div className="flex items-center gap-1">
                      <Trophy size={12} className="text-gray-400" />
                      <span className="text-gray-400">Rank: #{prizePoint.rank}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award size={12} className="text-gray-400" />
                      <span className="text-gray-400">Status: {prizePoint.tier}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-400">Awarded: {new Date(prizePoint.award_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gift size={12} className="text-gray-400" />
                      <span className="text-gray-400">Redemption: {prizePoint.redemption_quarter}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}