import { useEffect } from 'react';
import { X, Trophy, Heart, Activity, Users, Star } from 'lucide-react';
import { useCommunity } from '../../../hooks/useCommunity';
import type { LeaderboardEntry } from '../../../types/community';
import { Portal } from '../../ui/portal';

interface PlayerProfileModalProps {
  player: LeaderboardEntry;
  onClose: () => void;
}

export function PlayerProfileModal({ player, onClose }: PlayerProfileModalProps) {
  const { allCommunities } = useCommunity(player.userId);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Render modal through portal to avoid DOM hierarchy constraints
  return (
    <Portal>
      {/* Full screen overlay with blur effect */}
      <div 
        className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center" 
        onClick={onClose} 
      />
      
      {/* Modal content */}
      <div 
        className="fixed z-[1001] max-h-[85vh] w-full max-w-md bg-gray-800 rounded-lg shadow-2xl border border-gray-700/50 m-4"
        style={{ 
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Trophy className="text-white" size={32} />
                  )}
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">{player.name}</h2>
                  <div className="text-xs text-gray-400">Member Since: {
                    player.createdAt ? new Date(player.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Unknown'
                  }</div>
                  <div className="text-xs text-gray-400">Level {player.level}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Rocket and Stats */}
            <div className="flex gap-4 mb-6">
              {/* Stats */}
              <div className="space-y-3 w-full">
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="text-orange-500" size={14} />
                    <span className="text-sm text-gray-400">HealthScore</span>
                  </div>
                  <div className="text-lg font-bold text-white pl-6">{player.healthScore?.toFixed(2) || '0.00'}</div>
                </div>
                
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="text-orange-500" size={14} />
                    <span className="text-sm text-gray-400">+HealthSpan</span>
                  </div>
                  <div className="text-lg font-bold text-white pl-6">+{player.healthspanYears?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-700/50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <Users className="text-orange-500" size={16} />
                  <span className="text-gray-400">Communities:</span>
                </div>
                <div className="mt-2 space-y-2">
                  {allCommunities?.map((community) => (
                    <div 
                      key={community.id}
                      className="flex items-center gap-2 pl-6 py-1"
                    >
                      {community.isPrimary && (
                        <Star size={12} className="text-orange-500 shrink-0" />
                      )}
                      <span className="text-sm text-gray-300">{community.name}</span>
                    </div>
                  ))}
                  {(!allCommunities?.length) && (
                    <div className="pl-6 text-sm text-gray-500 italic">
                      No communities joined
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
      </div>
    </Portal>
  );
}