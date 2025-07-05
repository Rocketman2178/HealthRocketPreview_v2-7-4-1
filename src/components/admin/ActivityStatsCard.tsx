import React, { useState, useEffect } from 'react';
import { Activity, Zap, Target, Trophy, MessageSquare, Calendar, Heart } from 'lucide-react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase';

interface ActivityStatsCardProps {
  timeframe: 'day' | 'week' | 'month';
  setTimeframe: (timeframe: 'day' | 'week' | 'month') => void;
}

export function ActivityStatsCard({ timeframe, setTimeframe }: ActivityStatsCardProps) {
  const [stats, setStats] = useState({
    fuelPoints: 0,
    boostsCompleted: 0,
    healthAssessments: 0,
    challengeActions: 0,
    contestVerifications: 0,
    cosmoChats: 0,
    contestRegistrations: 0,
    averageHealthScore: 0,
    averageHealthspan: 0
  });
  const [loading, setLoading] = useState(true);

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
        
        // Get insights for the timeframe
        const { data: insightsData, error: insightsError } = await supabase
          .from('all_user_insights')
          .select('total_fp_earned, total_boosts_completed, challenge_actions, contest_verifications, cosmo_chats, contest_registrations, average_health_score, average_healthspan_years, health_assessments, new_users')
          .gte('date', startDateStr)
          .lte('date', endDateStr);
          
        if (insightsError) throw insightsError;
        
        // Sum up the stats
        const summedStats = {
          fuelPoints: 0,
          boostsCompleted: 0,
          healthAssessments: 0,
          challengeActions: 0,
          contestVerifications: 0,
          cosmoChats: 0,
          contestRegistrations: 0,
          averageHealthScore: 0,
          averageHealthspan: 0
        };
        
        insightsData?.forEach(insight => {
          summedStats.fuelPoints += insight.total_fp_earned || 0;
          summedStats.boostsCompleted += insight.total_boosts_completed || 0;
          summedStats.healthAssessments += insight.health_assessments || 0;
          summedStats.challengeActions += insight.challenge_actions || 0;
          summedStats.contestVerifications += insight.contest_verifications || 0;
          summedStats.cosmoChats += insight.cosmo_chats || 0;
          summedStats.contestRegistrations += insight.contest_registrations || 0;
          summedStats.healthAssessments += insight.health_assessments || 0;
          
          // For averages, we'll collect values to calculate later
          if (insight.average_health_score) {
            summedStats.averageHealthScore += insight.average_health_score;
          }
          
          if (insight.average_healthspan_years) {
            summedStats.averageHealthspan += insight.average_healthspan_years;
          }
        });
        
        // Calculate averages if we have data
        if (insightsData && insightsData.length > 0) {
          summedStats.averageHealthScore = summedStats.averageHealthScore / insightsData.length;
          summedStats.averageHealthspan = summedStats.averageHealthspan / insightsData.length;
        }
        
        setStats(summedStats);
      } catch (err) {
        console.error('Error fetching activity stats:', err);
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
            <Activity className="text-orange-500" size={20} />
            <span>Activity Statistics</span>
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
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-orange-500" />
            <div className="text-sm text-gray-400">Fuel Points</div>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.fuelPoints.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-orange-500" />
            <div className="text-sm text-gray-400">Boosts Completed</div>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.boostsCompleted.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={14} className="text-orange-500" />
            <div className="text-sm text-gray-400">Health Assessments</div>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.healthAssessments.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-orange-500" />
            <div className="text-sm text-gray-400">Challenge Actions</div>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.challengeActions.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-orange-500" />
            <div className="text-sm text-gray-400">Contest Verifications</div>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.contestVerifications.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-orange-500" />
            <div className="text-sm text-gray-400">Contest Registrations</div>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.contestRegistrations.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} className="text-orange-500" />
            <div className="text-sm text-gray-400">Cosmo Chats</div>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.cosmoChats.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-orange-500" />
            <div className="text-sm text-gray-400">Avg Health Score</div>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.averageHealthScore.toFixed(2)}</div>
        </div>
        
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={14} className="text-orange-500" />
            <div className="text-sm text-gray-400">Avg HealthSpan</div>
          </div>
          <div className="text-xl font-bold text-white">{loading ? '...' : stats.averageHealthspan.toFixed(2)} years</div>
        </div>
      </div>
    </Card>
  );
}