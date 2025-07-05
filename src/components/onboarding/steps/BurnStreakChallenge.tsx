import React from 'react';
import { Trophy, ChevronRight, Flame, Calendar, Award } from 'lucide-react';

interface BurnStreakChallengeProps {
  onContinue: () => void;
  onBack: () => void;
}

export function BurnStreakChallenge({ onContinue, onBack }: BurnStreakChallengeProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center">
          <Trophy className="text-orange-500" size={32} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white text-center mb-2">
        Preview Challenge
      </h2>
      
      <p className="text-gray-300 text-center mb-6">
        Secure your 2,500 shares by completing the challenge
      </p>

      <div className="space-y-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Flame className="text-orange-500" size={20} />
            <h3 className="text-lg font-medium text-white">Challenge Requirements</h3>
          </div>
          <p className="text-sm text-gray-400">
            Complete a 42-Day Burn Streak, earning at least 1 Fuel Point each day for 42 consecutive days. Must be completed during the preview period of June 1 to July 30 2025.
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Award className="text-orange-500" size={20} />
            <h3 className="text-lg font-medium text-white">Bonus Shares</h3>
          </div>
          <p className="text-sm text-gray-400">
            Bonus shares will be awarded to players based on the longest Burn Streaks and/or most Fuel Points earned during the preview period.
          </p>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="text-orange-500" size={20} />
            <h3 className="text-lg font-medium text-white">Alternative Eligibility</h3>
          </div>
          <p className="text-sm text-gray-400">
            Players who aren't able to complete the 42-Day Burn Streak will still be eligible to win prizes from Health Rocket Wellness Partners based on their Fuel Points earned during the preview period.
          </p>
        </div>

        <div className="flex gap-3 mt-4">
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          <button 
            onClick={onContinue}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 flex items-center justify-center gap-2 group"
          >
            <span>Continue</span>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}