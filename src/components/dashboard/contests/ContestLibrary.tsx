import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Award, Zap, ChevronDown, ChevronUp, Brain, Moon, Activity, Apple, Database, Clock, CheckCircle2, Calendar, Target, Trophy } from 'lucide-react';
import { ChallengeDetails } from '../challenge/ChallengeDetails';
import { Progress } from '../../ui/progress';
import { supabase } from '../../../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import type { Challenge } from '../../../types/dashboard';
import { useEffect, useState } from 'react';
import { contestChallenges } from '../../../data/challenges/contestChallenges';
import { useContestManager } from '../../../hooks/useContestManager';
import { tier0Challenge } from '../../../data/challenges';

interface ContestLibraryProps {
  userId: string | undefined;
  categoryScores: Record<string, number>;
  onClose: () => void;
  currentChallenges: Challenge[];
  onStartChallenge: (challengeId: string) => Promise<void>;
  activeChallengesCount: number;
}

export function ContestLibrary({ 
  userId, 
  categoryScores, 
  onClose,
  currentChallenges,
  onStartChallenge,
  activeChallengesCount
}: ContestLibraryProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedContest, setSelectedContest] = React.useState<Challenge | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [upcomingContests, setUpcomingContests] = useState<Challenge[]>([]);
  const [creditsInfo, setCreditsInfo] = useState<{
    has_credits: boolean;
    credits_remaining: number;
  } | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const { startContest } = useContestManager(userId);
  const navigate = useNavigate();

  // Check contest credits on mount
  useEffect(() => {
    const checkCredits = async () => {
      if (!userId) return;
      
      const { data, error } = await supabase
        .rpc('get_user_contest_credits', {
          p_user_id: userId
        });

      if (!error) {
        setCreditsInfo(data);
      }
    };

    checkCredits();
  }, [userId]);

  React.useEffect(() => {
    const fetchUpcomingContests = async () => {
      try {
        setError(null);
        const { data, error } = await supabase.rpc('get_upcoming_contests', {
          p_limit: 20,
         p_user_id: userId,
         p_check_community_eligibility: true
        });

        if (error) throw error;

        // Create a map for more efficient duplicate detection
        const uniqueContests = new Map();
        
        // First add all contest challenges from the frontend data
        contestChallenges.forEach(contest => {
         // Skip the old Oura Sleep Score Contest 2
         if (contest.id !== 'cn_oura_sleep_score_2') {
           uniqueContests.set(contest.id, contest);
         }
        });

        // Then add database contests, overriding any duplicates
        if (data) {
          data.forEach(contest => {
            // Use challenge_id as the unique identifier to avoid duplicates
            const challengeId = contest.challenge_id;
           // Skip the old Oura Sleep Score Contest 2
           if (challengeId !== 'cn_oura_sleep_score_2') {
             uniqueContests.set(challengeId, {
               id: challengeId, // Use challenge_id as the id
               challenge_id: challengeId,
               name: contest.name || 'Contest',
               description: contest.description || 'Contest description',
               startDate: contest.start_date,
               registrationEndDate: contest.registration_end_date,
               entryFee: contest.entry_fee,
               minPlayers: contest.min_players,
               category: contest.health_category,
               expertReference: contest.expert_reference || 'Health Rocket Team',
               requirements: contest.requirements || [],
               howToPlay: contest.how_to_play || {},
               implementationProtocol: contest.implementation_protocol || {},
               successMetrics: contest.success_metrics || [],
               expertTips: contest.expert_tips || [],
               fuelPoints: contest.fuel_points || 100,
               duration: contest.duration || 30,
               requiresDevice: contest.requires_device,
               requiredDevice: contest.required_device
              ,community_id: contest.community_id,
              community_name: contest.community_name,
              is_eligible: contest.is_eligible
             });
           }
          });
        }

        // Convert map values to array
       // Filter out contests that the user is not eligible for due to community restrictions
       const eligibleContests = Array.from(uniqueContests.values()).filter(contest => {
         // If the contest has is_eligible property, use it
         if (contest.is_eligible !== undefined) {
           return contest.is_eligible;
         }
       });
       
       setUpcomingContests(eligibleContests);
      } catch (err) {
        console.error('Error fetching upcoming contests:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch contests'));
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingContests();
  }, []);

  // Get all available contests from data files
  const availableContests = React.useMemo(() => {
    return contestChallenges;
  }, [contestChallenges]);

  React.useEffect(() => {
    setLoading(false);
  }, [userId]);

  const categories = [
    { id: 'mindset', name: 'Mindset', icon: Brain },
    { id: 'sleep', name: 'Sleep', icon: Moon },
    { id: 'exercise', name: 'Exercise', icon: Activity },
    { id: 'nutrition', name: 'Nutrition', icon: Apple },
    { id: 'biohacking', name: 'Biohacking', icon: Database }
  ];

  const filteredContests = React.useMemo(() => {
    if (!selectedCategory) return upcomingContests;
    
    // When a category is selected, filter by that category
    // Also check relatedCategories array if it exists
    return upcomingContests.filter(contest => {
      const mainCategory = contest.category?.toLowerCase() === selectedCategory.toLowerCase();
      const relatedCategory = contest.relatedCategories?.some(cat => 
        cat.toLowerCase() === selectedCategory.toLowerCase()
      );
      
      return mainCategory || relatedCategory;
    });
  }, [selectedCategory, upcomingContests]);

  const renderContest = (contest: Challenge) => {
    const startDate = contest.startDate ? new Date(contest.startDate) : null;
    const hasStarted = startDate ? startDate <= new Date() : true;
    const isRegistered = currentChallenges.some(c => {
      // Check both challenge_id and id fields to ensure we catch all matches
      return (c.challenge_id === contest.id || c.challenge_id === contest.challenge_id || 
              c.id === contest.id || c.id === contest.challenge_id);
    });

    return (
      <div className="w-full text-left p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Zap className="text-orange-500" size={14} />
            <span className="text-sm font-medium">+{contest.fuelPoints} FP</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              contest.entryFee ? 'bg-orange-500/10 text-orange-500' : 'bg-lime-500/10 text-lime-500'
            }`}
            >
              {contest.entryFee ? `Entry Fee: 1 Credit` : 'Free Entry'}
            </span>
            {contest.requiresDevice === true && (
              <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                {contest.requiredDevice} Required
              </span>
            )}
          </div>
        </div>
        <h3 className="font-bold text-white">{contest.name}</h3>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-orange-500" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{contest.category}</span>
              <span className="text-sm text-gray-400">•</span>
              <div className="flex items-center gap-1 text-gray-400">
                <Clock size={14} />
               <span className="text-sm">{contest.duration || 7} Days</span>
              </div>
            </div>
          </div>
          {startDate && !hasStarted && (
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-orange-500" />
              <span className="text-sm text-gray-400">
                Start Date: {" "}
                {formatInTimeZone(startDate, 'America/New_York', 'M/d/yyyy')}
              </span>
            </div>
          )}
          {contest.registrationEndDate && (
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-orange-500" />
              <span className="text-sm text-gray-400">
                Registration Ends: {" "}
                {formatInTimeZone(new Date(contest.registrationEndDate), 'America/New_York', 'M/d/yyyy')}
              </span>
            </div>
          )}
          {isRegistered && (
            <span className="text-xs bg-lime-500/20 px-2 py-0.5 rounded text-lime-500">
              Registered
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-white"></div>
      </div>
    );
  }

  const handleStartContest = async (contestId: string) => {
    try {
      setLoading(true);

      // Check if already registered
      const isRegistered = currentChallenges.some(c => 
        c.challenge_id === contestId || c.id === contestId
      );

      if (isRegistered) {
        throw new Error("Already registered");
      }

      try {
        const result = await startContest(contestId);
        if (result) {
          // Refresh the active contests list
          // This is now handled in startContest
          onClose();
        }
      } catch (error) {
        console.error("Error starting contest:", error);
        throw error;
      }
    } catch (err) {
      console.error('Failed to start contest:', err);
      setError(err instanceof Error ? err : new Error('Failed to start contest'));
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Target className="text-orange-500" size={20} />
            <div>
              <h2 className="text-xl font-bold text-white">Available Contests</h2>
              <p className="text-sm text-gray-300 mt-1">Select a Category to Explore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-4 border-b border-gray-700">
          {categories.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedCategory(selectedCategory === id ? null : id)}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors text-center ${
                selectedCategory === id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Icon size={16} />
              <span className="text-xs">{name}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Show upcoming contests first when no category selected */}
          {!selectedCategory && upcomingContests.length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="text-lg font-semibold text-white">Upcoming Contests</h3>
              {creditsInfo?.has_credits && (
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-orange-500" />
                    <span className="text-base font-bold text-orange-500">
                      {creditsInfo.credits_remaining} Contest {creditsInfo.credits_remaining === 1 ? 'Entry' : 'Entries'} Available
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1 ml-6">
                    Use your entry credits to join contests
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {upcomingContests.map(contest => {
                  const isRegistered = currentChallenges.some(c => 
                    c.challenge_id === contest.id || c.challenge_id === contest.challenge_id
                  );

                  return (
                    <div
                      key={contest.id}
                      onClick={() => !isRegistered && setSelectedContest(contest)}
                      className={`rounded-lg overflow-hidden transition-colors border-2 ${
                        isRegistered 
                          ? 'bg-gray-700/50 border-gray-700/50 cursor-not-allowed' 
                          : creditsInfo?.has_credits 
                            ? 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 cursor-pointer' 
                            : 'bg-gray-700/50 hover:bg-gray-700/70 border-gray-700/50 cursor-pointer'
                      }`}
                    >
                      {renderContest(contest)}
                      {!isRegistered && creditsInfo?.has_credits && (
                        <div className="px-4 pb-3 flex items-center gap-2">
                          <Trophy size={14} className="text-orange-500" />
                          <span className="text-sm text-orange-500 font-medium">Entry Credit Available</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedCategory && filteredContests.map(contest => {
            const isRegistered = currentChallenges.some(c => 
              c.challenge_id === contest.id || c.challenge_id === contest.challenge_id
            );

            return (
              <div
                key={contest.id}
                onClick={() => !isRegistered && setSelectedContest(contest)}
                className={`rounded-lg overflow-hidden transition-colors border-2 ${
                  isRegistered 
                    ? 'bg-gray-700/50 border-gray-700/50 cursor-not-allowed' 
                    : creditsInfo?.has_credits 
                      ? 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 cursor-pointer' 
                      : 'bg-gray-700/50 hover:bg-gray-700/70 border-gray-700/50 cursor-pointer'
                }`}
              >
                {renderContest(contest)}
                {!isRegistered && creditsInfo?.has_credits && (
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <Trophy size={14} className="text-orange-500" />
                    <span className="text-sm text-orange-500 font-medium">Entry Credit Available</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedContest && (
        <ChallengeDetails
          challenge={selectedContest}
          isContest={true}
          onClose={() => setSelectedContest(null)}
          onStart={() => handleStartContest(selectedContest.challenge_id || selectedContest.id)}
          activeChallengesCount={activeChallengesCount}
          maxChallenges={2}
          currentChallenges={currentChallenges.map(c => ({
            challenge_id: c.challenge_id,
            status: c.status
          }))}
          isRegistered={currentChallenges.some(c => 
            c.challenge_id === selectedContest.challenge_id || 
            c.challenge_id === selectedContest.id
          )}
          hasCredits={creditsInfo?.has_credits}
        />
      )}
    </div>
  );
}