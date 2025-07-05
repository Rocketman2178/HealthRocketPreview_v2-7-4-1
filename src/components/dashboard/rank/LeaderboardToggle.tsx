import React from 'react';
import { Users, Globe, Trophy } from 'lucide-react';

interface LeaderboardToggleProps {
  isGlobal: boolean;
  onToggle: () => void;
}

export function LeaderboardToggle({ isGlobal, onToggle }: LeaderboardToggleProps) {
  return (
    <div className="flex bg-gray-700/50 p-0.5 rounded-lg relative">
      <div className="absolute -top-6 left-0 text-xs text-gray-400">
        <Trophy size={12} className="inline-block mr-1 text-orange-500" />
        <span>Monthly Rankings</span>
      </div>
      <button
        onClick={() => isGlobal && onToggle()}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          !isGlobal ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Users size={14} />
        <span>Community</span>
      </button>
      <button
        onClick={() => !isGlobal && onToggle()}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          isGlobal ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Globe size={14} />
        <span>Global</span>
      </button>
    </div>
  );
}