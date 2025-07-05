import React from 'react';
import { Check, Lock, Info, X, Plus } from 'lucide-react';
import { useState } from 'react';

interface BoostItemProps {
  id: string;
  boostCategory:string;
  name: string;
  expertReference?: {
    name: string;
    expertise: string;
  };
  description: string;
  fuelPoints?: number;
  tier: 1 | 2;
  isCompletedThisWeek: boolean;
  isCompleted: boolean;
  isPreviousDay: boolean;
  isLocked: boolean;
  isDisabled: boolean;
  onComplete?: (id: string,boostCategory:string) => Promise<void>;
  boostsRemaining:number;
  healthImpact?: string;
}

export function BoostItem({ 
  id, 
  boostCategory,
  name, 
  expertReference,
  description,
  fuelPoints, 
  tier,
  isCompletedThisWeek,
  isCompleted,
  isPreviousDay,
  isLocked,
  isDisabled,
  onComplete ,
  boostsRemaining,
  healthImpact
}: BoostItemProps) {
  const [showDescription, setShowDescription] = useState(false);

  const handleClick = () => {
    setShowDescription(true);
  };


  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked && !isCompletedThisWeek && !isDisabled && onComplete && boostsRemaining >0) {
      onComplete(id,boostCategory)
        .then(fpEarned => {
          // Show success feedback
          console.log(`Completed ${name} for +${fpEarned || fuelPoints} FP`);
        })
        .catch(err => {
          console.error('Error completing boost:', err);
          // Could add user-facing error notification here
        });
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        className={`relative p-2.5 rounded-lg h-[72px] flex flex-col justify-between ${
          isLocked 
            ? 'bg-gray-800/50' // Locked boosts
            : isCompletedThisWeek 
              ? 'bg-gray-700 opacity-75' // Completed this week
              : 'bg-gray-700 hover:bg-gray-600 cursor-pointer' // Available boosts
        }`}>
        <div className={`text-[10px] font-medium ${isCompletedThisWeek ? 'text-gray-500' : 'text-gray-100'} line-clamp-2`}>
          {name}
        </div>
        <div className="flex items-center justify-between mt-1 relative">
          <span className={`text-[10px] ${
            isLocked || (isDisabled && !isCompleted)
              ? 'text-gray-500'
              : isCompleted 
                ? 'text-gray-400' 
                : 'text-orange-500' 
          }`}>+{fuelPoints} FP</span>
          {tier === 2 && (
            <span className="text-[10px] text-orange-500 font-medium px-1 py-0.5 bg-orange-500/10 rounded">Pro</span>
          )}
          {isLocked ? (
            <Lock size={14} className="text-gray-500" />
          ) : isCompletedThisWeek || isCompleted ? (
            <div className="w-4 h-4 rounded bg-lime-500 flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          ) : (
            <button
              onClick={handleClick}
              disabled={isDisabled}
              className={`text-orange-500 hover:text-orange-400 transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {showDescription && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-4 space-y-4 mb-24">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{name}</h3>
              {isCompletedThisWeek && (
                <span className="text-xs bg-gray-600 px-2 py-0.5 rounded text-gray-400">
                  Completed This Week
                </span>
              )}
              <button 
                onClick={() => setShowDescription(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{description}</p>
                
                {healthImpact && (
                  <div className="mt-4 p-3 bg-orange-500/10 rounded-lg">
                    <h4 className="text-sm font-medium text-orange-500 mb-1">Health Impact</h4>
                    <p className="text-xs text-gray-300">{healthImpact}</p>
                  </div>
                )}
              </div>
              
              {expertReference && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Expert Reference</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-300">{expertReference.name}</p>
                    <p className="text-xs text-gray-400">{expertReference.expertise}</p>
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Reward:</span>
                    <span className="text-orange-500">+{fuelPoints || 0} FP</span>
                    {tier === 2 && (
                      <span className="text-[10px] text-orange-500 font-medium px-1 py-0.5 bg-orange-500/10 rounded">Pro</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDescription(false)}
                      className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => {
                        handleCheckClick(e);
                        setShowDescription(false);
                      }}
                      disabled={isLocked || isDisabled || isCompleted || isCompletedThisWeek}
                      className="px-4 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}