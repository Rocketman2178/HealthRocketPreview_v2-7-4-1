import { useState, useEffect } from "react";
import {
  ChevronRight,
  Target,
  Trophy,
  X,
  Award,
  CheckCircle2,
  Calendar,
  Zap,
  MessageSquare,
  Users,
} from "lucide-react";
import { getChatPath } from "../../../lib/utils/chat";
import { useSupabase } from "../../../contexts/SupabaseContext";
import { supabase } from "../../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { ContestExamplesModal } from "./ContestExamplesModal";
import { ChallengePlayerList } from "../../chat/ChallengePlayerList";
import type { LeaderboardEntry } from "../../../types/community";

export interface ChallengeDetailsProps {
  challenge: {
    isPremium?: boolean;
    entryFee?: number;
    minPlayers?: number;
    name?: string;
    description?: string;
    id?: string;
    challenge_id?: string;
    category?: string;
    expertReference?: string;
    expertTips?: string[];
    fuelPoints?: number;
    duration?: number;
    startDate?: string;
    registrationEndDate?: string;
    howToPlay?: any;
    requirements?: any[];
    verifications_required?: number;
  };
  isRegistered?: boolean;
  nonPremiumChallengesCount?: number;
  maxChallenges?: number;
  loading?: boolean;
  hasCredits?: boolean;
  isContest?: boolean;
  hasCompletedTier0?: boolean;
  isCompleted?: boolean;
  onClose?: () => void;
  onStart?: () => void;
}

export function ChallengeDetails({
  challenge,
  isRegistered = false,
  nonPremiumChallengesCount = 0,
  maxChallenges = 2,
  loading = false,
  hasCredits = true,
  isContest = false,
  hasCompletedTier0 = false,
  isCompleted = false,
  onClose,
  onStart,
}: ChallengeDetailsProps) {
  const navigate = useNavigate();
  const [showExampleModal, setShowExampleModal] = useState<
    "daily" | "weekly" | null
  >(null);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const { user } = useSupabase();
  const [isUserRegistered, setIsUserRegistered] = useState(isRegistered);
  const [verificationCount, setVerificationCount] = useState<number>(0);
  const [verificationsRequired, setVerificationsRequired] = useState<number>(8);
  const [contestType, setContestType] = useState<"running" | "sleep">("sleep");

  // Check if contest has started
  const hasStarted = (() => {
    if (!challenge.startDate) return true;
    const startDate = new Date(challenge.startDate);
    return startDate <= new Date();
  })();

  // Determine contest type based on challenge_id
  useEffect(() => {
    if (challenge.challenge_id) {
      if (
        challenge.challenge_id.includes("hoka") ||
        challenge.challenge_id.includes("running")
      ) {
        setContestType("running");
      } else {
        setContestType("sleep");
      }
    }
  }, [challenge.challenge_id]);

  // Check if user is registered and get player count
  useEffect(() => {
    if (isContest && user?.id && challenge.challenge_id) {
      // Check if user is registered
      const checkRegistration = async () => {
        const { data: registrationStatus, error: registrationError } =
          await supabase.rpc("is_user_registered_for_contest", {
            p_user_id: user.id,
            p_challenge_id: challenge.challenge_id,
          });

        if (!registrationError) {
          setIsUserRegistered(!!registrationStatus);
        }
      };

      // Get player count and list
      const getPlayers = async () => {
        // Get player count
        const { data: count, error } = await supabase.rpc(
          "get_contest_players_count",
          {
            p_challenge_id: challenge.challenge_id,
          }
        );

        if (!error) {
          setPlayerCount(count || 0);
        }

        // Get player list
        const { data: playerData, error: playerError } = await supabase.rpc(
          "get_contest_players",
          {
            p_challenge_id: challenge.challenge_id,
          }
        );

        if (!playerError && playerData) {
          // Map to LeaderboardEntry format
          const mappedPlayers: LeaderboardEntry[] = playerData.map(
            (player: any) => ({
              userId: player.user_id,
              name: player.name || "Unknown Player",
              avatarUrl: player.avatar_url,
              level: player.level || 1,
              plan: player.plan || "Free Plan",
              healthScore: Number(player.health_score) || 7.8,
              healthspanYears: Number(player.healthspan_years) || 0,
              createdAt: player.created_at || new Date().toISOString(),
              rank: 0,
              fuelPoints: 0,
              burnStreak: player.burn_streak || 0,
            })
          );

          setPlayers(mappedPlayers);
        }
      };

      checkRegistration();
      getPlayers();
    }
  }, [isContest, user?.id, challenge.challenge_id]);

  // Fetch verification count for the contest
  useEffect(() => {
    if (isContest && isRegistered && user?.id && challenge.challenge_id) {
      const fetchVerificationCount = async () => {
        const { data, error } = await supabase
          .from("active_contests")
          .select("verification_count, verifications_required")
          .eq("user_id", user.id)
          .eq("challenge_id", challenge.challenge_id)
          .maybeSingle();

        if (!error && data) {
          setVerificationCount(data.verification_count || 0);
          setVerificationsRequired(
            data.verifications_required || challenge.verifications_required || 8
          );
        }
      };

      fetchVerificationCount();
    }
  }, [isContest, isRegistered, user?.id, challenge.challenge_id]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-700">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 mr-3"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="text-orange-500">
              {isContest ? <Trophy size={24} /> : <Target size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{challenge.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">
                  {challenge.category}
                </span>
                {challenge.startDate && (
                  <span className="text-sm text-gray-400">•</span>
                )}
                {challenge.startDate && (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar size={14} className="text-orange-500" />
                    <span>
                      Start Date:{" "}
                      {new Date(challenge.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {challenge.registrationEndDate && (
                  <>
                    <span className="text-sm text-gray-400">•</span>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Calendar size={14} className="text-orange-500" />
                      <span>
                        Registration Ends:{" "}
                        {new Date(
                          challenge.registrationEndDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
                {challenge.entryFee && challenge.entryFee > 0 && (
                  <span className="text-xs bg-orange-500/10 px-2 py-0.5 rounded text-orange-500">
                    Entry: 1 Credit
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Submit Posts Button for Active Contests */}
          {isContest && isRegistered && hasStarted && (
            <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="text-orange-500" size={20} />
                  <div>
                    <h3 className="text-white font-medium">
                      Submit Contest Verification Posts
                    </h3>
                    <p className="text-sm text-gray-300">
                      Post daily screenshots and weekly summary (
                      {verificationsRequired} total required)
                    </p>
                    <div className="flex items-center gap-1 text-xs text-lime-500 mt-1">
                      <CheckCircle2 size={12} />
                      <span>
                        {verificationCount} / {verificationsRequired}{" "}
                        Verifications Completed
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(getChatPath(challenge.challenge_id))}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Submit Posts
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Description</h3>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-300 whitespace-pre-line">
                {challenge.description}
              </p>
            </div>
          </div>

          {/* Contest Rewards - for Contests */}
          {isContest && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Contest Rewards
              </h3>
              <div className="space-y-3">
                <div className="bg-orange-500/10 p-3 rounded-lg">
                  <p className="text-sm text-white font-medium mb-2">
                    Top 10% of Players
                  </p>
                  <p className="text-sm text-gray-300">
                    Share 75% of the available reward pool, which could mean:
                  </p>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>
                        8 players: 6 Credits for top player (6X return)
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>
                        20 players: 6 Credits each for top 2 players (6X return)
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>
                        50 players: 6 Credits each for top 5 players (6X return)
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-lime-500/10 p-3 rounded-lg">
                  <p className="text-sm text-white font-medium">
                    Top 50% of Players
                  </p>
                  <p className="text-sm text-gray-300">Get your credit back</p>
                </div>

                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-sm text-white font-medium">
                    All Other Players
                  </p>
                  <p className="text-sm text-gray-300">Credits are forfeited</p>
                </div>
              </div>
            </div>
          )}

          {/* How to Play, How to Win - for Contests */}
          {isContest && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                How to Play, How to Win:
              </h3>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <ul className="space-y-2">
                  {challenge.challenge_id?.includes("hoka") ||
                  challenge.challenge_id?.includes("running") ? (
                    // HOKA Running Contest specific instructions
                    <>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Daily: Post Strava App screenshots of your Run
                          Activity *must including name, date, milage and heart
                          rate (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowExampleModal("daily");
                            }}
                            className="text-orange-500 hover:underline"
                          >
                            see example here
                          </button>
                          )
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Final Day: Post Strava App screenshot of your Run
                          mileage total for the days in the contest.
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Players must post at least 5 Run Activity screenshots
                          and the final Total Mileage screenshot to complete the
                          contest and be eligible for rewards
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Winners will be determined by players that meet the
                          Contest rules and have the highest Total Mileage.
                        </span>
                      </li>
                    </>
                  ) : challenge.challenge_id?.includes("oura") ||
                    challenge.challenge_id?.includes("sleep") ? (
                    // Oura Sleep Week Contest specific instructions
                    <>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Daily: Post Sleep Score screenshots from the Oura App
                          in the Contest Chat (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowExampleModal("daily");
                            }}
                            className="text-orange-500 hover:underline"
                          >
                            see example here
                          </button>
                          )
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Final Day: Post Sleep Score Week screenshot from the
                          Oura App (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowExampleModal("weekly");
                            }}
                            className="text-orange-500 hover:underline"
                          >
                            see example here
                          </button>
                          )
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Players must post all daily and final week screenshots
                          to complete the contest and be eligible for rewards
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Winners will be determined by players that complete
                          the contest with the highest Sleep Score Week totals.
                        </span>
                      </li>
                    </>
                  ) : (
                    // Default contest instructions
                    <>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Daily: Post verification screenshots in the Contest
                          Chat
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>Final Day: Post summary screenshot</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Players must complete all required verification posts
                          to be eligible for rewards
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>
                          Winners will be determined by players that complete
                          the contest with the highest scores.
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Expert Reference */}
          {challenge.expertReference && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Expert Reference
              </h3>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Award size={20} className="text-orange-500 mt-1 shrink-0" />
                  <p className="text-gray-300">{challenge.expertReference}</p>
                </div>
              </div>
            </div>
          )}

          {/* Requirements */}
          {challenge.requirements && challenge.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Requirements
              </h3>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <ul className="space-y-3">
                  {challenge.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3 relative">
                      <CheckCircle2
                        size={18}
                        className="text-orange-500 mt-0.5 shrink-0"
                      />
                      <span className="text-gray-300">
                        {typeof req === "string" ? req : req.description}
                        {isContest && index === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowExampleModal("daily");
                            }}
                            className="text-orange-500 hover:underline ml-1"
                          >
                            (See examples here)
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Expert Tips */}
          {challenge.expertTips && challenge.expertTips.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Expert Tips
              </h3>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <ul className="space-y-3">
                  {challenge.expertTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Award
                        size={18}
                        className="text-orange-500 mt-0.5 shrink-0"
                      />
                      <span className="text-gray-300">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Contest Rules */}
          {isContest ? (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Challenge Details
              </h3>
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-orange-500" />
                    <span className="text-gray-300">Duration:</span>
                  </div>
                  <span className="text-white font-medium">
                    {challenge.duration || 7} Days
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-orange-500" />
                    <span className="text-gray-300">Reward:</span>
                  </div>
                  <span className="text-white font-medium">
                    +{challenge.fuelPoints || 150} FP
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Challenge Details
              </h3>
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-orange-500" />
                    <span className="text-gray-300">Duration:</span>
                  </div>
                  <span className="text-white font-medium">
                    {challenge.duration || 21} Days
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-orange-500" />
                    <span className="text-gray-300">Reward:</span>
                  </div>
                  <span className="text-white font-medium">
                    +{challenge.fuelPoints || 50} FP
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-orange-500" />
            <span className="text-orange-500 font-medium">
              +{challenge.fuelPoints || 50} FP
            </span>
            {isRegistered && !isContest && !isCompleted && (
              <span className="text-xs text-gray-400 ml-2">(+10 FP daily)</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isRegistered && !isContest && !isCompleted && (
              <button
                onClick={() =>
                  navigate(`/challenge/${challenge.challenge_id}/daily`, {
                    replace: true,
                    state: { fromChallenge: true },
                  })
                }
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Go to Daily Form
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              Cancel
            </button>
            <button
              onClick={onStart}
              disabled={
                (isUserRegistered && !isCompleted) ||
                (!challenge.isPremium &&
                  nonPremiumChallengesCount >= maxChallenges) ||
                (!hasCompletedTier0 &&
                  challenge.id !== "mb0" &&
                  !challenge.isPremium &&
                  !isContest) ||
                (challenge.entryFee && challenge.entryFee > 0 && !hasCredits) ||
                loading
              }
              className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                isUserRegistered && !isCompleted
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : !challenge.isPremium &&
                    nonPremiumChallengesCount >= maxChallenges
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : !hasCompletedTier0 &&
                    challenge.id !== "mb0" &&
                    !challenge.isPremium &&
                    !isContest
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : challenge.entryFee && challenge.entryFee > 0 && !hasCredits
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
            >
              {isUserRegistered ? (
                isCompleted ? (
                  "Restart Challenge"
                ) : (
                  "Already Registered"
                )
              ) : !challenge.isPremium &&
                nonPremiumChallengesCount >= maxChallenges ? (
                "No Slots Available"
              ) : !hasCompletedTier0 &&
                challenge.id !== "mb0" &&
                challenge.challenge_id !== "mb0" &&
                !challenge.isPremium &&
                !isContest ? (
                "Complete Morning Basics First"
              ) : loading ? (
                "Starting..."
              ) : challenge.entryFee &&
                challenge.entryFee > 0 &&
                !hasCredits ? (
                "No Credits Available"
              ) : (
                <>
                  {challenge.entryFee && challenge.entryFee > 0
                    ? "Register for Contest"
                    : "Start Challenge"}
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Player Count Display */}
        {isContest && (
          <div className="p-4 border-t border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-300">
                <Users size={16} className="text-orange-500" />
                <span>{playerCount || 0} Players Registered</span>
              </div>
              {playerCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPlayerList(true);
                  }}
                  className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
                >
                  <span>View Players</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Player List Modal */}
      {showPlayerList && (
        <ChallengePlayerList
          players={players}
          loading={false}
          onClose={() => setShowPlayerList(false)}
          isContest={true}
        />
      )}

      {/* Example Modal */}
      {showExampleModal && (
        <ContestExamplesModal
          type={showExampleModal}
          contestType={contestType}
          onClose={() => setShowExampleModal(null)}
        />
      )}
    </div>
  );
}
