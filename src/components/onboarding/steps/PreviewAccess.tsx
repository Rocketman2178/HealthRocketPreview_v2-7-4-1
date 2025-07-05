import React from 'react';
import { Trophy, ChevronRight, DollarSign, BarChart3 } from 'lucide-react';

interface PreviewAccessProps {
  onContinue: () => void;
  onBack: () => void;
}

export function PreviewAccess({ onContinue, onBack }: PreviewAccessProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center">
          <Trophy className="text-orange-500" size={32} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white text-center mb-2">
        Preview Access
      </h2>
      
      <p className="text-gray-300 text-center mb-6">
        Exclusive to Invited Preview Players
      </p>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="text-orange-500" size={20} />
              <h3 className="text-lg font-medium text-white">Free Pro Plan Subscription</h3>
            </div>
            <p className="text-sm text-gray-400">
              Full access to premium features until July 30, 2025
            </p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3"> 
              <Trophy className="text-orange-500" size={20} />
              <h3 className="text-lg font-medium text-white">$300 in credits</h3>
            </div>
            <p className="text-sm text-gray-400">
              Enter contests and win prizes
            </p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="text-orange-500" size={20} />
              <h3 className="text-lg font-medium text-white">Earn 2,500 equity shares</h3>
            </div>
            <p className="text-sm text-gray-400">
              Complete a 42-Day Burn Streak to earn your shares
            </p>
          </div>
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