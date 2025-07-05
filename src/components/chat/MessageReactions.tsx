import React, { useState } from 'react';
import { Zap, User } from 'lucide-react';

interface MessageReactionsProps {
  reactions: any[];
  hasReacted: boolean;
  onReact: (e: React.MouseEvent) => void;
  isOwnMessage: boolean;
  isHovering: boolean;
}

export function MessageReactions({ 
  reactions, 
  hasReacted, 
  onReact,
  isOwnMessage,
  isHovering
}: MessageReactionsProps) {
  const [showReactors, setShowReactors] = useState(false);
  
  // Always show the reaction button
  return (
    <div className="flex items-center relative">
      {/* Reaction count button */}
      {reactions.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowReactors(!showReactors);
          }}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${
            hasReacted 
              ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50' 
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-gray-700/50'
          }`}
        >
          <Zap size={12} className={hasReacted ? 'text-orange-500' : 'text-gray-400'} />
          <span>{reactions.length}</span>
        </button>
      )}
      
      {/* Like button - always visible */}
      {!isOwnMessage && (
        <button
          onClick={onReact}
          className={`ml-2 transition-colors flex items-center gap-1 border rounded-full px-1.5 py-0.5 ${
            hasReacted 
              ? 'text-orange-500 border-orange-500/50 bg-orange-500/10' 
              : 'text-gray-400 hover:text-orange-500 border-gray-600 hover:border-orange-500/50'
          }`}
          title={hasReacted ? "Remove reaction" : "Add reaction"}
        >
          <Zap size={12} />
          <span className="text-xs">
            {hasReacted ? "Liked" : "Like"}
          </span>
        </button>
      )}
      
      {/* Reactors List Popup */}
      {showReactors && reactions.length > 0 && (
        <div 
          className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-2 z-10 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-gray-400 mb-1">Reactions</div>
          <div className="max-h-[120px] overflow-y-auto">
            {reactions.map((reaction) => (
              <div key={reaction.id} className="flex items-center gap-2 py-1">
                <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
                  <User size={12} className="text-gray-400" />
                </div>
                <span className="text-xs text-gray-300">
                  {reaction.users?.name || 'User'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}