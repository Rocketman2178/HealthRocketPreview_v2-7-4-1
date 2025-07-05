import React, { useState, useEffect } from 'react';
import { Users, Activity, Calendar, ChevronLeft, ChevronRight, Zap, Trophy, Target } from 'lucide-react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase';

interface UserStatsCardProps {
  timeframe: 'day' | 'week' | 'month';
  setTimeframe: (timeframe: 'day' | 'week' | 'month') => void;
}

export function UserStatsCard({ timeframe, setTimeframe }: UserStatsCardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    subscribedUsers: 0,
    contestUsers: 0,
    challengeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Get date range based on timeframe
        const endDate = new Date();
        let startDate = new Date();
        
        if (timeframe === 'day') {
          startDate.setDate(startDate.getDate() - 1);
        } else if (timeframe === 'week') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeframe === 'month') {
          startDate.setDate(startDate.getDate() - 30);
        }
        
        // Format dates for query
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Get insights data from all_user_insights for the timeframe
        const { data: insightsData, error: insightsError } = await supabase
          .from('all_user_insights')
          .select('total_users, new_users, active_users')
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .order('date', { ascending: false });
          
        if (insightsError) throw insightsError;
        
        // Get the latest record for total counts
        const latestInsight = insightsData && insightsData.length > 0 ? insightsData[0] : null;
        
        // Get subscribed users (users with Pro Plan and Active status)
        const { data: subscribedUsersData, error: subscribedUsersError } = await supabase
          .from('users')
          .select('count')
          .eq('plan', 'Pro Plan')
          .eq('plan_status', 'Active')
          .single();
          
        if (subscribedUsersError && subscribedUsersError.code !== 'PGRST116') throw subscribedUsersError;
        
        // Get contest users (users who have registered for at least one contest)
        const { data: contestUsersData, error: contestUsersError } = await supabase
          .from('active_contests')
          .select('user_id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        if (contestUsersError) throw contestUsersError;
        
        // Count unique contest users
        const uniqueContestUsers = contestUsersData ? new Set(contestUsersData.map(row => row.user_id)) : new Set();
        
        // Get challenge users (users who have at least one active challenge)
        const { data: challengeUsersData, error: challengeUsersError } = await supabase
          .from('challenges')
          .select('user_id')
          .eq('status', 'active')
          .gte('started_at', startDate.toISOString())
          .lte('started_at', endDate.toISOString());
          
        if (challengeUsersError) throw challengeUsersError;
        
        // Count unique challenge users
        const uniqueChallengeUsers = challengeUsersData ? new Set(challengeUsersData.map(row => row.user_id)) : new Set();
        
        setStats({
          totalUsers: latestInsight?.total_users || 0,
          newUsers: latestInsight?.new_users || 0,
          activeUsers: latestInsight?.active_users || 0,
          subscribedUsers: subscribedUsersData?.count || 0,
          contestUsers: uniqueContestUsers.size,
          challengeUsers: uniqueChallengeUsers.size
        });
        
        // Calculate total pages
        setTotalPages(Math.ceil(latestInsight?.total_users / 10) || 1);
      } catch (err) {
        console.error('Error fetching user stats:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [timeframe]);

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="text-orange-500" size={20} />
            <span>User Statistics</span>
          </h3>
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg overflow-hidden">
            <button 
              onClick={() => setTimeframe('day')}
              className={`px-3 py-1 text-xs ${timeframe === 'day' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Day
            </button>
            <button 
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 text-xs ${timeframe === 'week' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              7 Days
            </button>
            <button 
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 text-xs ${timeframe === 'month' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              30 Days
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <Calendar size={14} />
          <span>
            {timeframe === 'day' ? 'Last 24 hours' : 
             timeframe === 'week' ? 'Last 7 days' : 
             'Last 30 days'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-700/50 p-3 rounded-lg" title="Total registered users">
          <div className="text-sm text-gray-400 mb-1">Total Users</div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.totalUsers.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg" title="New users registered in this period">
          <div className="text-sm text-gray-400 mb-1">New Users</div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.newUsers.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg" title="Users who earned Fuel Points in this period">
          <div className="text-sm text-gray-400 mb-1">Active Users</div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.activeUsers.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg" title="Users with active Pro Plan subscriptions">
          <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
            <Zap size={14} className="text-orange-500" />
            <span>Subscribed Users</span>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.subscribedUsers.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg" title="Users registered for contests in this period">
          <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
            <Trophy size={14} className="text-orange-500" />
            <span>Contest Users</span>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.contestUsers.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg" title="Users with active challenges in this period">
          <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
            <Target size={14} className="text-orange-500" />
            <span>Challenge Users</span>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.challengeUsers.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>
        
        <div className="text-xs text-gray-400">
          Page {currentPage + 1} of {totalPages}
        </div>
        
        <button
          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </Card>
  );
}