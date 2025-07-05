import React, { useState, useEffect } from 'react';
import { Users, Trophy, MessageSquare, Ticket, Activity, Zap, Calendar, BarChart, Target, Award, ChevronLeft, ChevronRight, ArrowLeft, X, Heart, HelpCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { AdminLayout } from './AdminLayout';
import { ActivityStatsCard } from './ActivityStatsCard';
import { UserStatsCard } from './UserStatsCard';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalFP: 0,
    averageFP: 0,
    totalBoosts: 0,
    totalChallenges: 0,
    totalQuests: 0,
    totalContests: 0,
    totalMessages: 0,
    challengeActions: 0,
    newUsers: 0,
    contestRegistrations: 0,
    challengeRegistrations: 0,
    cosmoChats: 0,
    contestVerifications: 0,
    averageHealthScore: 0,
    averageHealthspan: 0,
    healthAssessments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDetails, setUserDetails] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        let insights;
        
        if (timeframe === 'day') {
          // Get latest daily insights
          const { data, error } = await supabase
            .from('all_user_insights')
            .select('*')
            .order('date', { ascending: false })
            .limit(1)
            .single();
            
          if (error) throw error;
          insights = data;
        } else if (timeframe === 'week') {
          // Get last 7 days aggregated
          const { data, error } = await supabase
            .from('all_user_insights')
            .select('*')
            .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('date', { ascending: false });
            
          if (error) throw error;
          
          // Aggregate the data
          insights = aggregateInsights(data);
        } else if (timeframe === 'month') {
          // Get last 30 days aggregated
          const { data, error } = await supabase
            .from('all_user_insights')
            .select('*')
            .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('date', { ascending: false });
            
          if (error) throw error;
          
          // Aggregate the data
          insights = aggregateInsights(data);
        }
        
        setStats({
          totalUsers: insights.total_users || 0,
          activeUsers: insights.active_users || 0,
          newUsers: insights.new_users || 0,
          totalFP: insights.total_lifetime_fp || 0,
          averageFP: insights.average_fp_per_user || 0,
          totalBoosts: insights.total_lifetime_boosts || 0,
          totalChallenges: insights.total_lifetime_challenges || 0,
          totalQuests: insights.total_lifetime_quests || 0,
          totalContests: insights.total_contests_active || 0,
          totalMessages: insights.total_lifetime_chat_messages || 0,
          challengeActions: insights.challenge_actions || 0,
          contestRegistrations: insights.contest_registrations || 0,
          challengeRegistrations: insights.challenge_registrations || 0,
          cosmoChats: insights.cosmo_chats || 0,
          contestVerifications: insights.contest_verifications || 0,
          averageHealthScore: insights.average_health_score || 0,
          averageHealthspan: insights.average_healthspan_years || 0,
          healthAssessments: insights.health_assessments || 0
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [timeframe]);

  // Function to aggregate insights data
  const aggregateInsights = (data) => {
    if (!data || data.length === 0) return {};
    
    // Use the most recent record for user counts
    const latestRecord = data[0];
    
    // Sum up the activity metrics
    const aggregated = {
      total_users: latestRecord.total_users,
      active_users: latestRecord.active_users,
      total_lifetime_fp: latestRecord.total_lifetime_fp,
      average_fp_per_user: latestRecord.average_fp_per_user,
      total_lifetime_boosts: latestRecord.total_lifetime_boosts,
      total_lifetime_challenges: latestRecord.total_lifetime_challenges,
      total_lifetime_quests: latestRecord.total_lifetime_quests,
      total_contests_active: latestRecord.total_contests_active,
      total_lifetime_chat_messages: latestRecord.total_lifetime_chat_messages,
      challenge_actions: 0,
      contest_registrations: 0,
      challenge_registrations: 0,
      cosmo_chats: 0,
      total_lifetime_chat_messages: latestRecord.total_lifetime_chat_messages,
      average_health_score: latestRecord.average_health_score,
      average_healthspan_years: latestRecord.average_healthspan_years,
      health_assessments: 0,
      challenge_actions: 0,
      contest_registrations: 0,
      challenge_registrations: 0,
      cosmo_chats: 0,
      contest_verifications: 0
    };
    
    // Sum up the daily metrics
    data.forEach(record => {
      aggregated.challenge_actions += record.challenge_actions || 0;
      aggregated.contest_registrations += record.contest_registrations || 0;
      aggregated.challenge_registrations += record.challenge_registrations || 0;
      aggregated.cosmo_chats += record.cosmo_chats || 0;
      aggregated.contest_verifications += record.contest_verifications || 0;
      aggregated.health_assessments += record.health_assessments || 0;
    });
    
    return aggregated;
  };

  // Function to fetch user details
  const fetchUserDetails = async () => {
    try {
      setUserLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, plan, level, fuel_points, burn_streak, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      
      setUserDetails(data || []);
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setUserLoading(false);
    }
  };

  return (
    <AdminLayout title="Admin Dashboard" icon={<Activity className="text-orange-500\" size={24} />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 cursor-pointer hover:bg-gray-800/70 transition-colors\" onClick={() => {
          setShowUserDetails(!showUserDetails);
          if (!showUserDetails) fetchUserDetails();
        }}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Users className="text-orange-500" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{loading ? '...' : stats.totalUsers}</div>
              <div className="text-sm text-gray-400 flex items-center gap-1">
                Total Users
                <ChevronRight size={14} className="text-orange-500" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 cursor-pointer hover:bg-gray-800/70 transition-colors" onClick={() => {
          setShowUserDetails(!showUserDetails);
          if (!showUserDetails) fetchUserDetails();
        }}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Zap className="text-orange-500" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{loading ? '...' : stats.totalFP.toLocaleString()}</div>
              <div className="text-sm text-gray-400 flex items-center gap-1">
                Total Fuel Points
                <ChevronRight size={14} className="text-orange-500" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Calendar className="text-orange-500" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{loading ? '...' : stats.activeUsers}</div>
              <div className="text-sm text-gray-400">Active Users (7d)</div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ActivityStatsCard timeframe={timeframe} setTimeframe={setTimeframe} />
        <UserStatsCard timeframe={timeframe} setTimeframe={setTimeframe} />
      </div>
      
      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {userLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
                </div>
              ) : userDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-xs text-gray-400 uppercase">
                      <tr>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Plan</th>
                        <th className="px-4 py-2">Level</th>
                        <th className="px-4 py-2">FP</th>
                        <th className="px-4 py-2">Streak</th>
                        <th className="px-4 py-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {userDetails.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-700/50">
                          <td className="px-4 py-3 font-medium text-white">{user.name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-gray-300">{user.email}</td>
                          <td className="px-4 py-3 text-gray-300">{user.plan}</td>
                          <td className="px-4 py-3 text-gray-300">{user.level}</td>
                          <td className="px-4 py-3 text-gray-300">{user.fuel_points}</td>
                          <td className="px-4 py-3 text-gray-300">{user.burn_streak}</td>
                          <td className="px-4 py-3 text-gray-300">{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No user data available</p>
                </div>
              )}
              
              <button
                onClick={() => navigate('/admin/support')}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-3"
              >
                <HelpCircle size={18} className="text-orange-500" />
                <span>Support & Feedback</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}