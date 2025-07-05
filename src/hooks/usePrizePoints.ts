import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PrizePoint {
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

export function usePrizePoints(userId: string | undefined) {
  const [prizePoints, setPrizePoints] = useState<PrizePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const fetchPrizePoints = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase.rpc('get_user_prize_points', {
          p_user_id: userId
        });
        
        if (error) throw error;
        
        if (data?.success) {
          const points = data.prize_points || [];
          setPrizePoints(points);
          
          // Calculate total prize points
          const total = points.reduce((sum: number, pp: PrizePoint) => sum + pp.prize_points, 0);
          setTotalPoints(total);
        } else {
          throw new Error(data?.error || 'Failed to fetch prize points');
        }
      } catch (err) {
        console.error('Error fetching prize points:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch prize points'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrizePoints();
  }, [userId]);

  return {
    prizePoints,
    totalPoints,
    loading,
    error
  };
}