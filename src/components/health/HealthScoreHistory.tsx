import React from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, User, Users } from 'lucide-react';
import type { HealthAssessment } from '../../types/health';

interface HealthScoreHistoryProps {
  assessments: HealthAssessment[];
}

export function HealthScoreHistory({ assessments }: HealthScoreHistoryProps) {
  // Sort assessments by date (oldest to newest)
  const sortedAssessments = [...assessments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Only show up to the last 5 assessments for the chart
  const recentAssessments = sortedAssessments.slice(-5);

  // Calculate min and max scores for scaling
  const scores = recentAssessments.map(a => a.health_score);
  const minScore = Math.max(0, Math.min(...scores) - 0.5);
  const maxScore = Math.min(10, Math.max(...scores) + 0.5); 
  
  // Calculate the range for scaling
  const range = maxScore - minScore;
  
  // Function to calculate the height percentage for a score
  const getHeightPercentage = (score: number) => {
    return ((score - minScore) / range) * 100;
  };

  // Function to get trend icon
  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    if (current > previous) return <TrendingUp className="text-lime-500" size={14} />;
    if (current < previous) return <TrendingDown className="text-orange-500" size={14} />;
    return <Minus className="text-gray-400" size={14} />;
  };

  // Generate average user data (simulated)
  const generateAverageData = () => {
    return recentAssessments.map((assessment, index) => {
      // Start with a base score of 7.5 and add some variation
      const baseScore = 7.5;
      // Slight upward trend (0.05 per assessment)
      const trend = index * 0.05;
      // Add small random variation (-0.2 to +0.2)
      const variation = (Math.random() * 0.4) - 0.2;
      
      return {
        date: new Date(assessment.created_at),
        score: baseScore + trend + variation
      };
    });
  };

  const averageUserData = generateAverageData();

  // If no assessments, show a message
  if (recentAssessments.length === 0) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-4 text-center">
        <Activity className="text-orange-500 mx-auto mb-2" size={24} />
        <p className="text-gray-300">No assessment history available</p>
        <p className="text-xs text-gray-400 mt-1">Complete assessments to see your progress</p>
      </div>
    );
  }

  // If only one assessment, show a message
  if (recentAssessments.length === 1) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">HealthScore Trajectory</h3>
          <div className="text-xs text-gray-400">First Assessment</div>
        </div>
        <div className="flex items-center justify-center py-2">
          <div className="flex flex-col items-center">
            <div className="text-lg font-bold text-white">{recentAssessments[0].health_score.toFixed(1)}</div>
            <div className="text-xs text-gray-400">
              {new Date(recentAssessments[0].created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Complete more assessments to see your progress over time
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white">HealthScore Trajectory</h3>
        <div className="text-xs text-gray-400">Last {recentAssessments.length} Assessments</div>
      </div> 
      
      {/* Chart */}
      <div className="relative h-32 mt-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-400">
          <div>{maxScore.toFixed(1)}</div>
          <div>{minScore.toFixed(1)}</div>
        </div>
        
        {/* Chart area */}
        <div className="absolute left-10 right-0 top-0 bottom-0">
          {/* Horizontal grid lines */}
          <div className="absolute left-0 right-0 top-0 border-t border-gray-600/30"></div>
          <div className="absolute left-0 right-0 top-1/4 border-t border-gray-600/30"></div>
          <div className="absolute left-0 right-0 top-1/2 border-t border-gray-600/30"></div>
          <div className="absolute left-0 right-0 top-3/4 border-t border-gray-600/30"></div>
          <div className="absolute left-0 right-0 bottom-0 border-t border-gray-600/30"></div>
          
          {/* Date labels */}
          <div className="absolute left-0 right-0 bottom-0 flex justify-between items-end">
            {recentAssessments.map((assessment, index) => {
              const prevScore = index > 0 ? recentAssessments[index - 1].health_score : undefined;
              
              return (
                <div key={assessment.id} className="flex flex-col items-center">
                  {/* Date label */}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(assessment.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  
                  {/* Score with trend */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-white">{assessment.health_score.toFixed(2)}</span>
                    {getTrendIcon(assessment.health_score, prevScore)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* User score line (orange) */}
          <svg className="absolute inset-0 pointer-events-none" preserveAspectRatio="none">
            <polyline
              points={recentAssessments.map((assessment, index) => {
                const x = (index / (recentAssessments.length - 1)) * 100;
                const y = 100 - getHeightPercentage(assessment.health_score);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#FF6B00" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Average user line (blue) */}
            <polyline
              points={averageUserData.map((point, index) => {
                const x = (index / (averageUserData.length - 1)) * 100;
                const y = 100 - getHeightPercentage(point.score);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="5,5"
            />
          </svg>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-orange-500 mr-2"></div>
          <span className="text-xs text-gray-300 flex items-center">
            <User size={12} className="mr-1 text-orange-500" /> You
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-blue-500 mr-2 border-t border-dashed"></div>
          <span className="text-xs text-gray-300 flex items-center">
            <Users size={12} className="mr-1 text-blue-500" /> Avg User
          </span>
        </div>
      </div>
    </div>
  );
}