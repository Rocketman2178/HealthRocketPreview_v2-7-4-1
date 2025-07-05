import React from 'react';
import { Trophy, Target, Zap, Radio } from 'lucide-react';

interface TabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const tabs = [
    {
      id: 'standings',
      label: 'Player Standings',
      icon: Trophy
    },
    {
      id: 'boosts',
      label: 'Daily Boosts',
      icon: Zap
    },
    {
      id: 'challenges',
      label: 'Challenges & Quests',
      icon: Target
    }
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 mb-6">
     <h3 className="text-orange-500 text-center font-bold mt-3 mb-2">Mission Navigation</h3>
     <div className="w-24 h-0.5 bg-orange-500/50 mx-auto mb-3"></div>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 px-2 text-xs whitespace-pre-line transition-colors ${
                activeTab === tab.id
                  ? 'text-orange-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <tab.icon size={20} />
                <span className="text-sm">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}