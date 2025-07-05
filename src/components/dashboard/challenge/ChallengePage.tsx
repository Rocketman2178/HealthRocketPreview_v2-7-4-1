import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChallengeDetails } from './ChallengeDetails';
import { tier0Challenge } from '../../../data/challenges/tier0Challenge';
import { contestChallenges } from '../../../data/challenges/contestChallenges';
import { supabase } from '../../../lib/supabase';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { getChatPath } from '../../../lib/utils/chat';
import type { Challenge } from '../../../types/dashboard';
import { MorningBasicsForm } from './MorningBasicsForm';
import { Brain, Moon, Activity, Apple, Database, X, MessageSquare, CheckCircle2, CheckSquare } from 'lucide-react';
import { Zap, Trophy } from 'lucide-react';
import { ChallengeDataService } from '../../../lib/challenge/ChallengeDataService';

export function ChallengePage() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const [loading, setLoading] = useState<boolean>(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isContest, setIsContest] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [daysUntilStart, setDaysUntilStart] = useState<number | null>(null);
  const [hasCredits, setHasCredits] = useState<boolean>(true);
  const [challengeData, setChallengeData] = useState<any>(null);
  const [verificationCount, setVerificationCount] = useState<number>(0);
  const [verificationsRequired, setVerificationsRequired] = useState<number>(8);
  const [isMorningBasics, setIsMorningBasics] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [autoStarting, setAutoStarting] = useState<boolean>(false);
  const [dailyActions, setDailyActions] = useState<any[]>([]);
  const [canCompleteToday, setCanCompleteToday] = useState<boolean>(true);
  const location = useLocation();
  
  
  // Check if we're coming from the daily form to prevent navigation loops
  const fromDaily = location.state?.fromDaily === true;
  
  // Auto-start challenge function
  const autoStartChallenge = async () => {
    if (!user || autoStarting) return;
    setAutoStarting(true);
    
    try {
      // Use upsert to handle existing challenges gracefully
      const { data, error } = await supabase
        .from('challenges')
        .upsert({
          user_id: user.id,
          challenge_id: challengeId || 'mb0',
          status: 'active',
          category: 'Bonus',
          name: 'Morning Basics',
          description: 'Complete at least 3 of 5 morning actions each day',
          challenge_data: {}
        }, {
          onConflict: 'user_id,challenge_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Refresh the challenge data
        const { data: challengeExists, error: challengeError } = await supabase
          .from('challenges')
          .select('id, status, verification_count, started_at, progress, completed_at')
          .eq('user_id', user.id)
          .eq('challenge_id', challengeId)
          .maybeSingle();

        if (!challengeError && challengeExists) {
          const today = new Date().toISOString().split('T')[0];
          const { data: todayCompletion, error: todayError } = await supabase
            .from('completed_actions')
            .select('id')
            .eq('user_id', user.id)
            .eq('action_id', 'morning_basics_daily')
            .eq('completed_date', today)
            .maybeSingle();

          const { data: completedChallenge, error: completedError } = await supabase
            .from('completed_challenges')
            .select('id, completed_at')
            .eq('user_id', user.id)
            .eq('challenge_id', 'mb0')
            .maybeSingle();

          const challengeDataResult = {
            exists: true,
            challenge_id: challengeExists.id,
            days_completed: challengeExists.verification_count || 0,
            can_complete_today: !todayCompletion,
            status: challengeExists.status,
            completed: !!completedChallenge || (challengeExists.status === 'completed'),
            completed_at: completedChallenge?.completed_at || challengeExists.completed_at
          };

          setChallengeData(challengeDataResult);
        }
      } else {
        console.error('Failed to start challenge');
      }
    } catch (err) {
      console.error('Error starting challenge:', err);
    } finally {
      setAutoStarting(false);
    }
  };

  // Fetch daily actions for a challenge
  const fetchDailyActions = async () => {
    if (!challengeId || !user?.id) return;
    
    try {
      // Get daily actions for this challenge
      const { data, error } = await supabase.rpc(
        'get_challenge_daily_actions',
        { p_challenge_id: challengeId }
      );
      
      if (error) throw error;
      setDailyActions(data || []);
      
      // Check if user can complete actions today
      const { data: statusData, error: statusError } = await supabase.rpc(
        'get_challenge_daily_status',
        { 
          p_user_id: user.id,
          p_challenge_id: challengeId
        }
      );
      
      if (statusError) throw statusError;
      
      if (statusData?.success) {
        setCanCompleteToday(statusData.can_complete_today || false);
      }
      
      // Check if user is already registered for this challenge
      const { data: challengeExists, error: challengeError } = await supabase
        .from('challenges')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .maybeSingle();
        
      if (!challengeError && challengeExists) {
        setIsRegistered(true);
      }
    } catch (err) {
      console.error('Error fetching daily actions:', err);
    }
  };

  // Effect to determine challenge type and set initial state
  useEffect(() => {
    if (!challengeId) return;

    const morningBasicsId = 'mb0';
    const isContestChallenge = challengeId.startsWith('cn_') || challengeId.startsWith('tc_');
    
    setIsMorningBasics(challengeId === morningBasicsId);
    setIsContest(isContestChallenge);
  }, [challengeId]);

  // Effect to fetch challenge details
  useEffect(() => {
    if (!challengeId) return;

    const fetchChallenge = async () => {
      setLoading(true);
      
      try {
        // Handle Morning Basics challenge
        if (isMorningBasics) {
          setChallenge(tier0Challenge);
          
          if (user?.id) {
            // Check if challenge exists for user and get verification count
            const { data: challengeExists, error: challengeError } = await supabase
              .from('challenges')
              .select('id, status, verification_count, started_at, progress, completed_at')
              .eq('user_id', user.id)
              .eq('challenge_id', challengeId)
              .maybeSingle();

            if (challengeError) {
              console.error("Error checking challenge existence:", challengeError);
            }

            // If challenge doesn't exist, auto-start it
            if (!challengeExists && !autoStarting) {
              await autoStartChallenge();
            } else if (challengeExists) {
              // Challenge exists, fetch the data
              const today = new Date().toISOString().split('T')[0];
              const { data: todayCompletion, error: todayError } = await supabase
                .from('completed_actions')
                .select('id')
                .eq('user_id', user.id)
                .eq('action_id', 'morning_basics_daily')
                .eq('completed_date', today)
                .maybeSingle();

              const { data: completedChallenge, error: completedError } = await supabase
                .from('completed_challenges')
                .select('id, completed_at')
                .eq('user_id', user.id)
                .eq('challenge_id', 'mb0')
                .maybeSingle();

              if (todayError) {
                console.error("Error checking today's completion:", todayError);
              }

              const challengeDataResult = {
                exists: true,
                challenge_id: challengeExists.id,
                days_completed: challengeExists.verification_count || 0,
                can_complete_today: !todayCompletion,
                status: challengeExists.status,
                completed: !!completedChallenge || (challengeExists.status === 'completed'),
                completed_at: completedChallenge?.completed_at || challengeExists.completed_at
              };

              console.log("Morning Basics data:", challengeDataResult);
              setChallengeData(challengeDataResult);
            }
          }
        } else {
          // Handle other challenge types
          
          // Check if challenge is completed
          if (user?.id) {
            const { data: completedChallenge, error: completedError } = await supabase
              .from('completed_challenges')
              .select('id')
              .eq('user_id', user.id)
              .eq('challenge_id', challengeId)
              .maybeSingle();
            
            if (!completedError) {
              setIsCompleted(!!completedChallenge);
            }
          }
          
          // Check if user is already registered for this contest
          if (isContest && user?.id) {
            // Use the new RPC function to check registration status
            const { data: registrationStatus, error: registrationError } = await supabase.rpc(
              'is_user_registered_for_contest',
              {
                p_user_id: user.id,
                p_challenge_id: challengeId
              }
            );
            
            if (!registrationError) {
              setIsRegistered(!!registrationStatus);
            }
          }
         
          // If this is a contest and user is logged in, fetch verification count
          if (isContest && user?.id) {
            const { data, error } = await supabase
              .from('active_contests')
              .select('verification_count, verifications_required')
              .eq('user_id', user.id)
              .eq('challenge_id', challengeId)
              .maybeSingle();

            if (!error && data) {
              setVerificationCount(data.verification_count || 0);
              setVerificationsRequired(data.verifications_required || 8);
            }
          }

          // Find challenge details
          // First try to get from database
          let challengeDetails = await ChallengeDataService.getChallengeById(challengeId);

          // If not found in database, check hardcoded contest challenges
          if (!challengeDetails) {
            const hardcodedChallenge = contestChallenges.find(c => 
              c.challenge_id === challengeId || c.id === challengeId
            );
            
            if (hardcodedChallenge) {
              challengeDetails = hardcodedChallenge;
            }
          }
          
          // If still not found, try to get from database
          if (!challengeDetails && isContest) {
            try {
              console.log('Fetching contest details from database for:', challengeId);
              // Fetch contest details from database
              const { data, error } = await supabase.rpc('get_contest_details', {
                p_challenge_id: challengeId
              });
              
              if (error) {
                console.error('Error fetching contest details:', error);
              }
              
              if (!error && data?.success) {
                console.log('Contest details fetched successfully:', data);
                challengeDetails = {
                  id: data.challenge_id,
                  challenge_id: data.challenge_id,
                  name: data.name,
                  category: 'Contests',
                  description: data.description,
                  expertReference: data.expert_reference,
                  requirements: data.requirements || [],
                  verificationMethod: null,
                  expertTips: data.expert_tips || [],
                  fuelPoints: data.fuel_points || 50,
                  duration: data.duration || 7,
                  progress: 0,
                  daysRemaining: 0,
                  isPremium: true,
                  entryFee: data.entry_fee,
                  minPlayers: data.min_players,
                  startDate: data.start_date,
                  howToPlay: data.how_to_play
                };
              }
            } catch (err) {
              console.error('Error fetching contest details:', err);
            }
          }
          
          setChallenge(challengeDetails || null);
        }
      } catch (err) {
        console.error('Error fetching challenge:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChallenge();
  }, [challengeId, user?.id, isMorningBasics, isContest, autoStarting]);

  // Effect to fetch daily actions
  useEffect(() => {
    if (challengeId && user?.id && !isMorningBasics) {
      fetchDailyActions();
    }
  }, [challengeId, user?.id, isMorningBasics]);

  // Effect to handle navigation for registered regular challenges
  useEffect(() => {
    if (isRegistered && !isContest && !isMorningBasics && !loading) {
      // Only navigate to daily form if not coming from it already and not in a loading state
      if (!fromDaily && !loading) {
        navigate(`/challenge/${challengeId}/daily`, { 
          replace: true,
          state: { fromChallenge: true }
        });
      }
    } 
  }, [isRegistered, isContest, isMorningBasics, loading, navigate, challengeId, location.state]);

  if (loading || autoStarting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4" />
          {autoStarting && <p className="text-white">Setting up your challenge...</p>}
          {!autoStarting && <p className="text-white">Loading challenge...</p>}
        </div>
      </div>
    );
  }
  
  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Challenge Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-orange-500 hover:text-orange-400"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render Morning Basics challenge
  if (isMorningBasics) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Morning Basics Challenge</h2>
            <button
            onClick={() => navigate('/', { 
              replace: true,
              state: { fromChallenge: true }
            })}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mt-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-white font-medium">Days Completed</div>
                <div className="text-orange-500 font-medium">
                  {challengeData?.days_completed || 0}/21 <span className="text-xs text-gray-400">({(challengeData?.days_completed || 0) * 5} FP earned)</span>
                </div>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full"
                  style={{ width: `${((challengeData?.days_completed || 0) / 21) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {challengeData?.completed 
                  ? "Challenge completed! Tier 1 Challenges are now unlocked." 
                  : "Complete all 21 days to unlock Tier 1 Challenges"}
              </p>
            </div>
          </div>
          
          {challengeData?.completed ? (
            <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-16 h-16 bg-lime-500/20 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="text-lime-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Challenge Completed! <span className="text-orange-500">+50 FP Bonus</span></h3>
                <p className="text-gray-300 mb-4">
                  You've completed all 21 days of the Morning Basics Challenge.
                </p>
                <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="text-lime-500" size={16} />
                    <div>
                      <span className="text-white font-medium">Tier 1 Challenges Unlocked! </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <MorningBasicsForm 
              challengeId={challengeId || 'mb0'}
              onCompleted={() => {
                // Refresh the challenge data
                window.location.reload();
              }}
              onClose={() => navigate('/')}
            />
          )}
          
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Morning Basics Challenge</h3>
            <p className="text-sm text-gray-300 mb-4">
              Complete at least 3 of these 5 actions within 2 hours of waking each day for <span className="text-orange-500 font-medium">+5 FP daily</span>:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Brain size={16} className="text-orange-500 mt-1" />
                <div>
                  <div className="text-white font-medium">Mindset</div>
                  <div className="text-sm text-gray-400">2-minute gratitude reflection</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Moon size={16} className="text-orange-500 mt-1" />
                <div>
                  <div className="text-white font-medium">Sleep</div>
                  <div className="text-sm text-gray-400">Track sleep time or sleep score</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Activity size={16} className="text-orange-500 mt-1" />
                <div>
                  <div className="text-white font-medium">Exercise</div>
                  <div className="text-sm text-gray-400">5-minute stretch</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Apple size={16} className="text-orange-500 mt-1" />
                <div>
                  <div className="text-white font-medium">Nutrition</div>
                  <div className="text-sm text-gray-400">Glass of water</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Database size={16} className="text-orange-500 mt-1" />
                <div>
                  <div className="text-white font-medium">Biohacking</div>
                  <div className="text-sm text-gray-400">5 minutes of morning sunlight exposure</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-orange-500" size={20} />
              <h4 className="text-lg font-medium text-white">Rewards</h4>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1"></div>
                <span><span className="text-orange-500 font-medium">+5 FP</span> for each day you complete at least 3 actions</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1"></div>
                <span><span className="text-orange-500 font-medium">+50 FP bonus</span> when you complete all 21 days</span>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1"></div>
                <span>Unlocks Tier 1 Challenges upon completion</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Navigate to daily form
  const navigateToDailyForm = () => {
    navigate(`/challenge/${challengeId}/daily`, { 
      replace: true,
      state: { fromChallenge: true }
    });
  };

  // Render daily actions form for regular challenges
  const renderDailyActionsForm = () => {
    if (!dailyActions || dailyActions.length === 0) {
      return (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
          <p className="text-gray-300 text-center">No daily actions available for this challenge.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-white mb-4">Complete Daily Actions</h3>
        <p className="text-sm text-gray-300 mb-6">
          Select at least 2 actions that you've completed today:
        </p>
        
        <div className="space-y-3 mb-6">
          {dailyActions.map((action, index) => (
            <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 rounded-full">
                  {action.category === 'Mindset' && <Brain size={16} className="text-orange-500" />}
                  {action.category === 'Sleep' && <Moon size={16} className="text-orange-500" />}
                  {action.category === 'Exercise' && <Activity size={16} className="text-orange-500" />}
                  {action.category === 'Nutrition' && <Apple size={16} className="text-orange-500" />}
                  {action.category === 'Biohacking' && <Database size={16} className="text-orange-500" />}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{action.action_text}</div>
                  <div className="text-xs text-gray-400 mt-1">{action.description}</div>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-700 text-gray-400">
                  <CheckSquare size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Select at least 2 actions
          </div>
          <button
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canCompleteToday}
          >
            {canCompleteToday ? 'Complete Day' : 'Already Completed Today'}
          </button>
        </div>
      </div>
    );
  };

  // If still loading or redirecting, show loading spinner
  if (loading || (isRegistered && !isContest && !isMorningBasics)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-white">Redirecting to daily form...</p>
      </div>
    );
  }

  // Render other challenge types
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Submit Posts Button for Active Contests */}
      {isContest && user && (
        <div className="fixed top-20 left-0 right-0 z-10 flex justify-center">
          <div className="bg-gray-800 rounded-lg shadow-lg border border-orange-500/20 p-4 max-w-xl w-full mx-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-orange-500\" size={20} />
                <div>
                  <h3 className="text-white font-medium">Submit Contest Verification Posts</h3>
                  <p className="text-sm text-gray-300">Post daily screenshots and weekly summary ({verificationsRequired} total required)</p>
                  <div className="flex items-center gap-1 text-xs text-lime-500 mt-1">
                    <CheckCircle2 size={12} />
                    <span>{verificationCount} / {verificationsRequired} Verifications Completed</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(getChatPath(challengeId))}
                disabled={!challenge?.startDate || new Date(challenge.startDate) > new Date()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !challenge?.startDate || new Date(challenge.startDate) > new Date()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {!challenge?.startDate || new Date(challenge.startDate) > new Date()
                  ? 'Contest Not Started'
                  : 'Submit Posts'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Daily Actions Form for Regular Challenges */}
      {!isContest && !isMorningBasics && (
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col items-center">
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg mb-6 max-w-md w-full flex flex-col">
            <div className="flex items-center gap-3">
              <CheckSquare className="text-orange-500" size={20} />
              <div>
                <h3 className="text-white font-medium">Complete Daily Actions</h3>
                <p className="text-sm text-gray-300">Select 2 of 7 daily actions to earn +10 FP</p>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
              onClick={() => navigate(`/challenge/${challengeId}`, { 
                replace: true,
                state: { fromChallenge: true }
              })}
                className="text-sm text-orange-500 hover:text-orange-400"
              >
                View Challenge Details
              </button>
            <button
              onClick={() => navigate(`/challenge/${challengeId}/daily`, { 
                replace: true, 
                state: { fromChallenge: true } 
              })}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              {canCompleteToday ? 'Complete Today\'s Actions' : 'Already Completed Today'}
            </button>
            </div>
          </div>
        </div>
      )}

      <ChallengeDetails
        challenge={challenge}
        isContest={isContest}
        isRegistered={isRegistered}
        daysUntilStart={daysUntilStart}
        activeChallengesCount={1}
        maxChallenges={2}
        currentChallenges={[{
          challenge_id: challenge.id || challenge.challenge_id,
          status: 'active'
        }]}
        isCompleted={isCompleted}
        hasCompletedTier0={true}
        hasCredits={hasCredits}
        onClose={() => {
          // If this is a contest, navigate to the contests tab
          if (challenge.category === 'Contests') {
            navigate('/', { 
              replace: true,
              state: { 
                activeTab: 'contests',
                fromChallenge: true
              } 
            });
          } else {
            // For regular challenges, just navigate to the dashboard
            navigate('/', { 
              replace: true,
              state: { fromChallenge: true }
            });
          }
        }}
        onStart={() => {
          // If already registered, navigate to daily form
          if (isRegistered) {
            navigateToDailyForm();
          } else {
            // Otherwise start the challenge (this shouldn't happen in this view)
          }
        }}
      />
    </div>
  );
}