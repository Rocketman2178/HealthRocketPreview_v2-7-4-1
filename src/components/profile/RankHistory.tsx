import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';

interface MonthlyRank {
  month: number;
  year: number;
  rank: number;
  total_fp: number;
  percentile: number;
  status: string;
}

export function RankHistory() {
  const [monthlyRanks, setMonthlyRanks] = useState<MonthlyRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { user } = useSupabase();

  useEffect(() => {
    const fetchRankHistory = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch monthly FP totals which include rank information
        const { data, error } = await supabase
          .from('monthly_fp_totals')
          .select('year, month, rank, total_fp')
          .eq('user_id', user.id)
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(12);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Get community size for each month to calculate percentile
          const monthYearPairs = data.map(item => ({
            month: item.month,
            year: item.year
          }));
          
          // Get community sizes for each month
          const communitySizes: Record<string, number> = {};
          
          for (const { month, year } of monthYearPairs) {
            const { data: sizeData, error: sizeError } = await supabase.rpc(
              'get_monthly_community_size',
              { p_month: month, p_year: year }
            );
            
            if (!sizeError && sizeData) {
              communitySizes[`${year}-${month}`] = sizeData.community_size || 0;
            }
          }
          
          // Transform data with percentiles and status
          const transformedData: MonthlyRank[] = data.map(item => {
            const communitySize = communitySizes[`${item.year}-${item.month}`] || 100;
            const percentile = (item.rank / communitySize) * 100;
            
            // Determine status based on percentile
            let status = 'Commander';
            if (percentile <= 10) {
              status = 'Legend';
            } else if (percentile <= 50) {
              status = 'Hero';
            }
            
            return {
              month: item.month,
              year: item.year,
              rank: item.rank,
              total_fp: item.total_fp,
              percentile: Math.min(100, Math.round(percentile)),
              status
            };
          });
          
          setMonthlyRanks(transformedData);
        }
      } catch (err) {
        console.error('Error fetching rank history:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch rank history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRankHistory();
  }, [user]);

  // Get month name from month number
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Legend': return 'text-orange-500';
      case 'Hero': return 'text-lime-500';
      default: return 'text-gray-400';
    }
  };

  // Get status background color
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Legend': return 'bg-orange-500/20';
      case 'Hero': return 'bg-lime-500/20';
      default: return 'bg-gray-700/50';
    }
  };

  return (
    <Card className="bg-gray-800/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="text-orange-500" size={20} />
          <h3 className="text-lg font-semibold text-white">Ranking History</h3>
        </div>
        {monthlyRanks.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-300"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm py-2">{error}</div>
      ) : monthlyRanks.length === 0 ? (
        <div className="text-center py-4">
          <Trophy className="text-orange-500 mx-auto mb-2" size={24} />
          <p className="text-gray-400">No ranking history available yet</p>
          <p className="text-xs text-gray-500 mt-1">Complete a full month to see your ranking</p>
        </div>
      ) : (
        <>
          {/* Latest Month Summary */}
          <div className="bg-gray-700/50 p-3 rounded-lg mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-white font-medium">
                  {getMonthName(monthlyRanks[0].month)} {monthlyRanks[0].year}
                </span>
              </div>
              <div className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBgColor(monthlyRanks[0].status)} ${getStatusColor(monthlyRanks[0].status)}`}>
                {monthlyRanks[0].status}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Rank: #{monthlyRanks[0].rank}</span>
              <span className="text-orange-500 text-sm">{monthlyRanks[0].total_fp} FP</span>
            </div>
            
            {/* Progress bar for percentile */}
            <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${monthlyRanks[0].status === 'Legend' ? 'bg-orange-500' : monthlyRanks[0].status === 'Hero' ? 'bg-lime-500' : 'bg-gray-500'}`}
                style={{ width: `${100 - monthlyRanks[0].percentile}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Top {monthlyRanks[0].percentile <= 10 ? '10%' : monthlyRanks[0].percentile <= 50 ? '50%' : `${Math.round(monthlyRanks[0].percentile)}%`}</span>
              <span>{100 - monthlyRanks[0].percentile}% percentile</span>
            </div>
          </div>
          
          {/* Monthly History Chart */}
          {expanded && (
            <div className="space-y-4 mt-4">
              <div className="text-xs text-gray-400 uppercase font-medium">Monthly History</div>
              
              {/* Chart */}
              <div className="relative h-32 mt-4">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-400">
                  <div>Top</div>
                  <div>50%</div>
                  <div>100%</div>
                </div>
                
                {/* Chart area */}
                <div className="absolute left-10 right-0 top-0 bottom-0">
                  {/* Horizontal grid lines */}
                  <div className="absolute left-0 right-0 top-0 border-t border-gray-600/30"></div>
                  <div className="absolute left-0 right-0 top-1/2 border-t border-gray-600/30"></div>
                  <div className="absolute left-0 right-0 bottom-0 border-t border-gray-600/30"></div>
                  
                  {/* Status threshold lines */}
                  <div className="absolute left-0 right-0 top-[10%] border-t border-orange-500/30 border-dashed"></div>
                  <div className="absolute left-0 right-0 top-[50%] border-t border-lime-500/30 border-dashed"></div>
                  
                  {/* Status labels */}
                  <div className="absolute left-1 top-[5%] text-[10px] text-orange-500">Legend</div>
                  <div className="absolute left-1 top-[45%] text-[10px] text-lime-500">Hero</div>
                  <div className="absolute left-1 top-[75%] text-[10px] text-gray-400">Commander</div>
                  
                  {/* Bars */}
                  <div className="absolute left-0 right-0 bottom-0 flex justify-between items-end h-full">
                    {monthlyRanks.slice(0, 6).map((rank, index) => {
                      const height = 100 - rank.percentile;
                      const statusColor = 
                        rank.status === 'Legend' ? 'bg-orange-500' : 
                        rank.status === 'Hero' ? 'bg-lime-500' : 
                        'bg-gray-500';
                      
                      return (
                        <div key={`${rank.year}-${rank.month}`} className="flex flex-col items-center" style={{ width: `${100 / 6}%` }}>
                          <div 
                            className={`w-6 ${statusColor} rounded-t`} 
                            style={{ height: `${height}%` }}
                          ></div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            {getMonthName(rank.month).substring(0, 3)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Monthly History Table */}
              <div className="mt-4 space-y-2">
                {monthlyRanks.map((rank) => (
                  <div key={`${rank.year}-${rank.month}`} className="bg-gray-700/50 p-2 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-xs text-white">
                        {getMonthName(rank.month)} {rank.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">#{rank.rank}</span>
                      <span className="text-xs text-orange-500">{rank.total_fp} FP</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusBgColor(rank.status)} ${getStatusColor(rank.status)}`}>
                        {rank.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}