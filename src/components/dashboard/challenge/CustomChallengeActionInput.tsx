import React from 'react';
import { Trash, Brain, Moon, Activity, Apple, Database } from 'lucide-react';
import type { CustomChallengeFormAction } from '../../../types/customChallenge';
interface CustomChallengeActionInputProps {
  action: CustomChallengeFormAction;
  index: number;
  onChange: (index: number, field: keyof CustomChallengeFormAction, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function CustomChallengeActionInput({
  action,
  index,
  onChange,
  onRemove,
  canRemove
}: CustomChallengeActionInputProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Mindset':
        return <Brain size={16} className="text-orange-500" />;
      case 'Sleep':
        return <Moon size={16} className="text-orange-500" />;
      case 'Exercise':
        return <Activity size={16} className="text-orange-500" />;
      case 'Nutrition':
        return <Apple size={16} className="text-orange-500" />;
      case 'Biohacking':
        return <Database size={16} className="text-orange-500" />;
      default:
        return <Brain size={16} className="text-orange-500" />;
    }
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
            {index + 1}
          </div>
          <span className="text-sm text-gray-300">Action</span>
        </div>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash size={16} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={action.action_text}
            onChange={(e) => onChange(index, 'action_text', e.target.value)}
            placeholder="Action name (e.g., 'Meditate for 5 minutes') *"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        <div>
          <textarea
            value={action.description}
            placeholder="Description (optional)"
            onChange={(e) => onChange(index, 'description', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none h-20"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400">Category</span>
            {getCategoryIcon(action.category)}
          </div>
          <select
            value={action.category}
            onChange={(e) => onChange(index, 'category', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          >
            {['Mindset', 'Sleep', 'Exercise', 'Nutrition', 'Biohacking'].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}