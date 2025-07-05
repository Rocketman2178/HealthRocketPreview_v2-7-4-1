import React from 'react';
import { Rocket, Heart, Award, Target, Zap, Brain, Moon, Activity, Apple, Database, Check } from 'lucide-react';

interface GuidanceStepProps {
  onContinue: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function LaunchStep({ onContinue, onBack, isLoading }: GuidanceStepProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center">
          <Rocket className="text-orange-500" size={32} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white text-center mb-6">
        Your First Mission!
      </h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0 mt-1">
              <Check className="text-white" size={14} />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Complete Daily Boosts</p>
              <p className="text-xs text-gray-400">Build momentum with quick daily actions</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0 mt-1">
              <Check className="text-white" size={14} />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Achieve a Burn Streak of 3 Days</p>
              <p className="text-xs text-gray-400">Complete at least one boost daily</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0 mt-1">
              <Check className="text-white" size={14} />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Select Your First Challenge</p>
              <p className="text-xs text-gray-400">Begin with Morning Basics to unlock more</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          {onBack && (
            <button
              onClick={onBack}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          )}
          <button
            onClick={onContinue}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Launching...</span>
              </div>
            ) : (
              <>
                <span>Launch</span>
                <Rocket size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}