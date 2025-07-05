import React from 'react';
import { FileText, Edit } from 'lucide-react';
import { Card } from '../ui/card';

interface HealthGoalsCardProps {
  healthGoals?: string | null;
  canUpdate: boolean;
  daysUntilUpdate: number;
}

export function HealthGoalsCard({ 
  healthGoals, 
  canUpdate,
  daysUntilUpdate
}: HealthGoalsCardProps) {
  const isAvailable = daysUntilUpdate === 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Health Goals</h2>
        {canUpdate && (
          <div className="text-[11px] text-gray-400 text-right">
            <div>Next Update</div>
            <div>
              <span className={isAvailable ? 'text-lime-500' : 'text-orange-500'}>
                {isAvailable ? 'Available Now!' : `${daysUntilUpdate} Days`}
              </span>
            </div>
          </div>
        )}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-orange-500" size={24} />
          <div>
            <h3 className="font-bold text-white text-lg">Your Health Goals</h3>
            <p className="text-sm text-gray-400">Personal health objectives and aspirations</p>
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          {healthGoals ? (
            <div className="text-gray-300 whitespace-pre-line">
              {healthGoals}
            </div>
          ) : (
            <div className="text-gray-400 italic text-center py-4">
              <p>No health goals set yet.</p>
              <p className="text-sm mt-2">
                {canUpdate 
                  ? "Update your health assessment to set your goals." 
                  : `You can set your health goals in ${daysUntilUpdate} days when your next health assessment is available.`}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}