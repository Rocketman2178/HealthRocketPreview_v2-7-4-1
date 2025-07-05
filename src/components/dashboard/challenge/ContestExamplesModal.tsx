import React from 'react';
import { X, Info, Calendar } from 'lucide-react';

interface ContestExamplesModalProps {
  onClose: () => void;
  type: 'daily' | 'weekly';
  contestType?: 'running' | 'sleep';
}

export function ContestExamplesModal({ onClose, type, contestType = 'sleep' }: ContestExamplesModalProps) {
  // Determine contest type based on contestType prop or by analyzing challenge_id
  const isRunningContest = contestType === 'running';
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-4">
          {type === 'daily' 
            ? isRunningContest ? 'Daily Run Activity Example' : 'Daily Sleep Score Example'
            : isRunningContest ? 'Weekly Run Summary Example' : 'Weekly Sleep Score Example'
          }
        </h2>

        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="text-orange-500 mt-1" size={20} />
            <div>
              {isRunningContest && type === 'daily' ? (
                <div>
                  <p className="text-white font-medium mb-2">Daily Run Activity Requirements:</p>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Must include name, date, mileage and heart rate</li>
                    <li>• Screenshot must be from the Strava app</li>
                    <li>• Post one screenshot each day of the contest</li>
                  </ul>
                </div>
              ) : isRunningContest && type === 'weekly' ? (
                <div>
                  <p className="text-white font-medium mb-2">Weekly Run Summary Requirements:</p>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Must show total mileage for the contest period</li>
                    <li>• Screenshot must be from the Strava app</li>
                    <li>• Post on the final day of the contest</li>
                  </ul>
                </div>
              ) : type === 'daily' ? (
                <div>
                  <p className="text-white font-medium mb-2">Daily Screenshot Requirements:</p>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Must show "Today" at the top of the screen</li>
                    <li>• Score must be clearly visible</li>
                    <li>• Post one screenshot each day of the contest</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="text-white font-medium mb-2">Weekly Summary Requirements:</p>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Must show date range in bottom left (e.g., "June 8 - June 14")</li>
                    <li>• Weekly average score must be visible</li>
                    <li>• Find this view in the app: Trends - Sleep - Sleep Score - Week</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="border-2 border-orange-500/30 rounded-lg overflow-hidden">
            <img 
              src={getExampleImagePath(isRunningContest, type)}
              alt={isRunningContest
                ? (type === 'daily' ? "Daily Run Activity Example" : "Weekly Run Summary Example")
                : (type === 'daily' ? "Daily Sleep Score Example" : "Weekly Sleep Score Example")
              }
              className="max-w-full h-auto"
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 mb-4">
          {isRunningContest
            ? (type === 'daily'
              ? 'Example of a daily Run Activity screenshot from the Strava app.'
              : 'Example of a weekly Run Summary screenshot from the Strava app.')
            : (type === 'daily'
              ? 'Example of a daily Sleep Score screenshot from the Oura app.'
              : 'Example of a weekly Sleep Score average screenshot from the Oura app.')
          }
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  );
  
  // Helper function to get the correct image path based on contest type and example type
  function getExampleImagePath(isRunningContest: boolean, exampleType: 'daily' | 'weekly'): string {
    if (isRunningContest) {
      return '/images/contest/HOKA-running.jpg';
    } else {
      return exampleType === 'daily' 
        ? '/images/contest/oura-daily.jpg' 
        : '/images/contest/oura-weekly.jpg';
    }
  }
}