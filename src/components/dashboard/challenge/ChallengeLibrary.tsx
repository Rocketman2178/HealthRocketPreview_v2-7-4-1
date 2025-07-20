import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Award,
  Zap,
  ChevronDown,
  ChevronUp,
  Brain,
  Moon,
  Activity,
  Apple,
  Database,
  Clock,
  CheckCircle2,
  Calendar,
  Target,
  Trophy,
} from "lucide-react";
import { ChallengeDetails } from "./ChallengeDetails";
import { Progress } from "../../ui/progress";
import { useChallengeLibrary } from "../../../hooks/useChallengeLibrary";
import { tier0Challenges } from "../../../data/challenges/tier0Challenge";
import { supabase } from "../../../lib/supabase";
import type { Challenge } from "../../../types/dashboard";

interface ChallengeLibraryProps {
  userId: string | undefined;
  onClose: () => void;
  currentChallenges: Challenge[];
  onStartChallenge: (challengeId: string) => Promise<void>;
  activeChallengesCount: number;
  hasCompletedTier0?: boolean;
}

export function ChallengeLibrary({
  userId,
  onClose,
  currentChallenges,
  onStartChallenge,
  activeChallengesCount,
  hasCompletedTier0 = false,
}: ChallengeLibraryProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    "mindset"
  );
  const [selectedChallenge, setSelectedChallenge] =
    React.useState<Challenge | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { challenges: availableChallenges, loading: challengesLoading } =
    useChallengeLibrary();
  const [customChallengeCount, setCustomChallengeCount] = React.useState(0);
  const [completedChallenges, setCompletedChallenges] = React.useState<
    string[]
  >([]);
  const [tier0, setTier0] = React.useState<Challenge>(null);

  // Ensure availableChallenges is always an array
  const safeAvailableChallenges = React.useMemo(() => {
    return Array.isArray(availableChallenges) ? availableChallenges : [];
  }, [availableChallenges]);

  // Set default category to Mindset when Tier 1 is unlocked
  useEffect(() => {
    if (hasCompletedTier0 && !selectedCategory) {
      setSelectedCategory("mindset");
    }
  }, [hasCompletedTier0, selectedCategory]);

  // Fetch completed challenges
  useEffect(() => {
    const fetchCompletedChallenges = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("completed_challenges")
          .select("challenge_id")
          .eq("user_id", userId);

        if (error) throw error;

        setCompletedChallenges(data?.map((item) => item.challenge_id) || []);
      } catch (err) {
        console.error("Error fetching completed challenges:", err);
      }
    };

    fetchCompletedChallenges();
  }, [userId]);

  // Handle auto-expansion of recommended challenge
  useEffect(() => {
    const expandChallengeId = localStorage.getItem("expandChallenge");
    if (expandChallengeId) {
      // Find the challenge to expand
      const challenge = safeAvailableChallenges.find(
        (c) => c.id === expandChallengeId
      );
      if (challenge) {
        // Set the category and expand the challenge
        setSelectedCategory(challenge.category.toLowerCase());
        // Clear the stored ID
        localStorage.removeItem("expandChallenge");

        // Scroll to the challenge after a brief delay
        setTimeout(() => {
          const challengeEl = document.getElementById(
            `challenge-${expandChallengeId}`
          );
          if (challengeEl) {
            challengeEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);
      }
    }
  }, [safeAvailableChallenges]);

  // Fetch tier0 challenge separately
  useEffect(() => {
    setTier0(tier0Challenges[0]);
  }, []);

  React.useEffect(() => {
    setLoading(challengesLoading);
  }, [challengesLoading, userId]);

  // Check if all tier 1 challenges are completed for a category
  const hasCompletedTier1 = React.useMemo(() => {
    if (!selectedCategory) return false;
    const categoryChallenges = safeAvailableChallenges.filter(
      (c) =>
        c.category?.toLowerCase() === selectedCategory.toLowerCase() &&
        c.tier === 1
    );
    return categoryChallenges.every((c) => completedChallenges.includes(c.id));
  }, [safeAvailableChallenges, selectedCategory, completedChallenges]);

  // Fetch custom challenge count
  React.useEffect(() => {
    const fetchCustomChallengeCount = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("custom_challenges")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active");

        if (error) throw error;

        setCustomChallengeCount(data?.length || 0);
      } catch (err) {
        console.error("Error fetching custom challenge count:", err);
      }
    };

    fetchCustomChallengeCount();
  }, [userId]);

  const categories = [
    { id: "mindset", name: "Mindset", icon: Brain },
    { id: "sleep", name: "Sleep", icon: Moon },
    { id: "exercise", name: "Exercise", icon: Activity },
    { id: "nutrition", name: "Nutrition", icon: Apple },
    { id: "biohacking", name: "Biohacking", icon: Database },
  ];

  const filteredChallenges = React.useMemo(() => {
    if (!selectedCategory) return [];

    // Get all challenges for the selected category, excluding contests
    const categoryMatches = safeAvailableChallenges
      .filter(
        (challenge) =>
          challenge.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
      .map((challenge) => ({
        ...challenge,
        status: "available",
      }));

    return categoryMatches;
  }, [selectedCategory, safeAvailableChallenges]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-white"></div>
      </div>
    );
  }

  const maxChallenges = 2;

  const handleStartChallenge = async (challengeId: string) => {
    try {
      // Check if challenge is already active
      if (
        currentChallenges.some(
          (c) => c.challenge_id === challengeId || c.id === challengeId
        ) ||
        (!hasCompletedTier0 &&
          challengeId !== "mb0" &&
          !challengeId.startsWith("cn_") &&
          !challengeId.startsWith("tc_"))
      ) {
        return;
      }

      await onStartChallenge(challengeId);
      onClose();
    } catch (err) {
      console.error("Failed to start challenge", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Target className="text-orange-500" size={20} />
            <div>
              <h2 className="text-xl font-bold text-white">
                Available Challenges
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                Select a Category to Explore
              </p>
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
              data-category={id}
              key={id}
              onClick={() =>
                setSelectedCategory(selectedCategory === id ? null : id)
              }
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors text-center ${
                selectedCategory === id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <Icon size={16} />
              <span className="text-xs">{name}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Tier 1 Unlocked Message */}
          {hasCompletedTier0 && (
            <div className="text-center mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-1.5">
              <h3 className="text-sm font-medium text-white">
                Tier 1 Challenges Unlocked!
              </h3>
            </div>
          )}

          {/* Morning Basics Challenge */}
          {tier0 && !completedChallenges.includes("mb0") && (
            <div
              key={tier0.id}
              className={`${
                completedChallenges.includes("mb0")
                  ? "bg-lime-500/10 border border-lime-500/20"
                  : "bg-orange-500/10 border border-orange-500/20"
              } rounded-lg overflow-hidden cursor-pointer mb-4`}
              onClick={() => setSelectedChallenge(tier0)}
            >
              <div className="w-full text-left p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="text-orange-500" size={14} />
                        <span className="text-sm font-medium">
                          +{tier0.fuelPoints} FP
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-white">{tier0.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400">Bonus</span>
                      <div className="flex items-center gap-1 text-xs text-orange-500">
                        <Award size={12} />
                        <span>Health Rocket Team</span>
                      </div>
                      {completedChallenges.includes("mb0") && (
                        <span className="text-xs bg-lime-500/20 px-2 py-0.5 rounded text-lime-500">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category-specific challenges */}
          {selectedCategory && (
            <>
              {filteredChallenges.length > 0 ? (
                filteredChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    onClick={() => setSelectedChallenge(challenge)}
                    id={`challenge-${challenge.id}`}
                    className={`${
                      completedChallenges.includes(challenge.id)
                        ? "bg-lime-500/10 border border-lime-500/20"
                        : "bg-gray-700/50"
                    } rounded-lg overflow-hidden ${
                      challenge.tier === 2 && !hasCompletedTier1
                        ? "opacity-50"
                        : ""
                    } cursor-pointer hover:bg-gray-700/70 transition-colors`}
                  >
                    {renderChallenge(
                      challenge,
                      completedChallenges.includes(challenge.id)
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No challenges found for this category</p>
                </div>
              )}
            </>
          )}

          {/* No category selected - show available challenges */}
          {!selectedCategory && !hasCompletedTier0 && (
            <div className="mb-6">
              <div className="text-center mb-4 bg-orange-500/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white">
                  Available Challenges
                </h3>
                <p className="text-sm text-gray-400">
                  Complete Morning Basics Challenge to unlock all Tier 1
                  Challenges
                </p>
              </div>

              {/* Custom Challenge Info */}
              {customChallengeCount > 0 && (
                <div className="text-center text-gray-300 py-4 bg-gray-700/30 rounded-lg mb-4">
                  You have {customChallengeCount} active custom{" "}
                  {customChallengeCount === 1 ? "challenge" : "challenges"}{" "}
                  (doesn't count toward your limit of {maxChallenges} regular
                  challenges)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Closing div for the modal */}
      </div>

      {selectedChallenge && (
        <ChallengeDetails
          challenge={selectedChallenge}
          isRegistered={currentChallenges.some(
            (c) =>
              c.challenge_id === selectedChallenge.id ||
              c.id === selectedChallenge.id ||
              c.challenge_id === selectedChallenge.challenge_id
          )}
          isCompleted={completedChallenges.includes(selectedChallenge.id)}
          activeChallengesCount={activeChallengesCount}
          maxChallenges={2}
          currentChallenges={currentChallenges}
          hasCompletedTier0={hasCompletedTier0}
          onClose={() => setSelectedChallenge(null)}
          onStart={() => {
            // Handle Morning Basics challenge specially
            if (
              selectedChallenge.id === "mb0" ||
              selectedChallenge.challenge_id === "mb0"
            ) {
              navigate(`/challenge/mb0`);
            } else {
              handleStartChallenge(
                selectedChallenge.id || selectedChallenge.challenge_id
              );
            }
            onClose();
          }}
        />
      )}
    </div>
  );

  function renderChallenge(challenge: Challenge, isCompleted: boolean = false) {
    return (
      <>
        <div className="w-full text-left p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="text-orange-500" size={14} />
                  <span className="text-sm font-medium">
                    +{challenge.fuelPoints} FP
                  </span>
                </div>
                {challenge.category === "Contests" && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      challenge.entryFee
                        ? "bg-orange-500/10 text-orange-500"
                        : "bg-lime-500/10 text-lime-500"
                    }`}
                  >
                    {challenge.entryFee
                      ? `Entry Fee: $${challenge.entryFee}`
                      : "Free Entry"}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white">{challenge.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">
                  {challenge.category}
                </span>
                {challenge.expertReference && (
                  <div className="flex items-center gap-1 text-xs text-orange-500">
                    <Award size={12} />
                    <span>
                      {typeof challenge.expertReference === "string"
                        ? challenge.expertReference.split(" - ")[0]
                        : challenge.expertReference}
                    </span>
                  </div>
                )}
                {isCompleted && (
                  <span className="text-xs bg-lime-500/20 px-2 py-0.5 rounded text-lime-500">
                    Completed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
