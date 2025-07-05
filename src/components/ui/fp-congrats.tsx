import { Rocket, Zap, X, Flame, Award, Activity, Target } from 'lucide-react';

interface FPCongratsProps {
  fpEarned: number;
  category?: string;
  onClose: () => void;
}

// Helper function to capitalize the first letter of each word
const capitalizeCategory = (category: string): string => {
  if (!category) return '';
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export function FPCongrats({ fpEarned, category, onClose }: FPCongratsProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 transform animate-[bounceIn_0.5s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Rocket className="text-orange-500 animate-bounce" size={32} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white">
            {category ? `${capitalizeCategory(category)} Boost Completed!` : 'Fuel Points Earned!'}
          </h2>

          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-orange-500">
            <Zap size={24} className="animate-pulse" />
            <span>+{fpEarned} FP</span>
          </div>

          <p className="text-lg font-medium text-white">
            Keep It Up! Climb the Leaderboard and Level Up!
          </p>

          <div className="mt-6 space-y-4 text-left">
            <p className="text-sm font-medium text-gray-300">Earn More FP By:</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Zap size={16} className="text-orange-500 shrink-0" />
                <span>Completing Daily Boosts (up to 3 per day)</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Flame size={16} className="text-orange-500 shrink-0" />
                <span>Achieve a Burn Streak of 3, 7, or 21 days</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Target size={16} className="text-orange-500 shrink-0" />
                <span>Start a Challenge</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Activity size={16} className="text-orange-500 shrink-0" />
                <span>Complete a Health Assessment (every 30 days)</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Award size={16} className="text-orange-500 shrink-0" />
                <span>Launch a Quest</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}