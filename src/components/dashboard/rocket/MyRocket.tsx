import React, { useState, useEffect } from 'react';
import { Rocket, Info, Crown, Gift, Target, Palette, Trophy, Zap, X, Sparkles } from 'lucide-react';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { BoostCodeInput } from '../../ui/BoostCodeInput';
import { useSupabase } from '../../../contexts/SupabaseContext';

interface RocketInfoModalProps {
  level: number;
  onClose: () => void;
}

function RocketInfoModal({ level, onClose }: RocketInfoModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="text-orange-500" size={28} />
            <h2 className="text-2xl font-bold text-white">Blastoff!</h2>
          </div>
          <p className="text-lg text-gray-300">You've reached Level {level}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gift className="text-orange-500" size={20} />
            <span>Keep Earning FP to Unlock</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target size={18} className="text-orange-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-white">New Features at Higher Levels</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Palette size={18} className="text-orange-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-white">Custom Rocket Colors, Decals & Effects</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trophy size={18} className="text-orange-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-white">New Challenges & Quests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 text-center space-y-4">
        <div className="text-4xl font-bold text-orange-500 mb-2">BLASTOFF! 🚀</div>
        <h2 className="text-2xl font-bold text-white">
          Level {level} Completed!
        </h2>
        <div className="space-y-4 mt-4">
          <p className="text-gray-300">
            Keep earning FP to unlock:
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 justify-center text-gray-300">
              <Target size={18} className="text-orange-500" />
              <span>New Features at Higher Levels</span>
            </li>
            <li className="flex items-center gap-2 justify-center text-gray-300">
              <Palette size={18} className="text-orange-500" />
              <span>Custom Rocket Colors, Decals & Effects</span>
            </li>
            <li className="flex items-center gap-2 justify-center text-gray-300">
              <Sparkles size={18} className="text-orange-500" />
              <span>New Challenges & Quests</span>
            </li>
          </ul>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mt-4"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

interface MyRocketProps {
  nextLevelPoints: number;
  level: number;
  fuelPoints: number;
  showLevelUpModal: boolean;
  setShowLevelUpModal: (show: boolean) => void;
}

export function MyRocket({ 
  nextLevelPoints,
  level,
  fuelPoints,
  showLevelUpModal,
  setShowLevelUpModal
}: MyRocketProps) {
  const [showRocketInfo, setShowRocketInfo] = useState(false);
  const { user } = useSupabase();
  const [showBoostCodeInput, setShowBoostCodeInput] = useState(false);
  
  // Calculate progress percentage
  const progressPercentage = (fuelPoints / nextLevelPoints) * 100;
  const fpNeeded = nextLevelPoints - fuelPoints;

  // Check if user has enough FP to level up and trigger level up automatically
  useEffect(() => {
    const checkLevelUp = async () => {
      if (!user || fuelPoints < nextLevelPoints) return;
      
      try {
        // Call the level up function
        const { data, error } = await supabase.rpc('handle_level_up', {
          p_user_id: user.id,
          p_current_fp: fuelPoints
        });
        
        if (error) throw error;
        
        // Show celebration modal
        setShowLevelUpModal(true);
        
        // Trigger dashboard refresh
        window.dispatchEvent(new CustomEvent('dashboardUpdate'));
      } catch (err) {
        console.error('Error leveling up:', err);
      }
    };
    
    checkLevelUp();
  }, [user, fuelPoints, nextLevelPoints, setShowLevelUpModal]);

  return (
    <>
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Launch Progress</h2>
            <div className="text-gray-400">
              {fuelPoints} / {nextLevelPoints} FP
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Countdown to Level {level + 1}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Zap className="text-orange-500" size={14} />
                <span className="text-orange-500 font-medium">{progressPercentage.toFixed(1)}%</span>
                <button
                  onClick={() => setShowRocketInfo(true)}
                  className="text-gray-400 hover:text-gray-300 ml-1"
                >
                  <Info size={14} />
                </button>
              </div>
            </div>
            <Progress value={progressPercentage} />
            <div className="flex justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-orange-500">{fpNeeded} FP Needed</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBoostCodeInput(true)}
                  className="text-xs text-lime-500 hover:text-lime-400 flex items-center gap-1"
                >
                  <span>+</span>
                  <span>Redeem Boost Code</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Rocket Info Modal */}
      {showRocketInfo && (
        <RocketInfoModal
          level={level}
          onClose={() => setShowRocketInfo(false)}
        />
      )}
      
      {/* Level Up Celebration Modal */}
      {showLevelUpModal && (
        <LevelUpModal
          level={level}
          onClose={() => setShowLevelUpModal(false)}
        />
      )}
      
      {/* Boost Code Input Modal */}
      {showBoostCodeInput && (
        <BoostCodeInput
          onClose={() => setShowBoostCodeInput(false)}
        />
      )}
    </>
  );
}