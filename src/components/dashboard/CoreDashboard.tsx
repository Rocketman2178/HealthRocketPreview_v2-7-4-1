import { useState, useEffect } from "react";
import { Radio, Trophy, Rocket, AlertTriangle, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { scrollToSection } from "../../lib/utils";
import { TabNav } from "./TabNav";
import { Card } from "../ui/card";
import { CosmoChat } from "../cosmo/CosmoChat";
import { CompanyLogo } from "./header/CompanyLogo";
import { DashboardHeader } from "./header/DashboardHeader";
import { MyRocket } from "./rocket/MyRocket";
import { RankStatus } from "./rank/RankStatus";
import { QuestCard } from "./quest/QuestCard";
import { ChallengeGrid } from "./challenge/ChallengeGrid";
import { ContestsGrid } from "./contests/ContestsGrid";
import { DailyBoosts } from "./boosts/DailyBoosts";
import { useSupabase } from "../../contexts/SupabaseContext";
import { useDashboardData } from "../../hooks/useDashboardData";
import { usePlayerStats } from "../../hooks/usePlayerStats";
import { FPCongrats } from "../ui/fp-congrats";
import { useBoostState } from "../../hooks/useBoostState";
import { SubscriptionNotification } from "../subscription/SubscriptionNotification";

export function CoreDashboard() {
  const [fpEarned, setFpEarned] = useState<number | null>(null);
  const [fpCategory, setFpCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("standings");
  const [showInactiveAlert, setShowInactiveAlert] = useState(false);
  const { user } = useSupabase();
  const location = useLocation();
  const {
    data,
    loading: dashboardLoading,
    refreshData,
  } = useDashboardData(user);
  const {
    stats,
    loading: statsLoading,
    refreshStats,
    showLevelUpModal,
    setShowLevelUpModal,
  } = usePlayerStats(user);
  const {
    selectedBoosts,
    weeklyBoosts,
    burnStreak,
    todayStats,
    daysUntilReset,
    completeBoost,
  } = useBoostState(user?.id);

  // Check if user has been inactive for more than 3 days
  useEffect(() => {
    if (data?.days_since_fp && data.days_since_fp >= 3) {
      setShowInactiveAlert(true);
    } else {
      setShowInactiveAlert(false);
    }
  }, [data?.days_since_fp]);

  // Set active tab based on location state
  useEffect(() => {
    if (location.state?.activeTab) {
      // Set the active tab from location state
      const newTab = location.state.activeTab;
      setActiveTab(newTab);
      
      // Clear the state to prevent it from being reapplied on page refresh
      window.history.replaceState(
        { ...window.history.state, activeTab: undefined },
        document.title
      );
    }
  }, [location.state]);
  // Listen for dashboard update events
  useEffect(() => {
    const handleUpdate = (event: Event) => {
      // Refresh data when dashboard update event is triggered
      refreshData().catch(err => console.error("Error refreshing data:", err));
      
      // Check if event has FP earned data
      if (event instanceof CustomEvent && event.detail?.fpEarned) {
        setFpEarned(event.detail.fpEarned);
        if (event.detail?.updatedPart === "boost" && event.detail?.category) {
          setFpCategory(event.detail.category);
        } else {
          setFpCategory(null);
        }
      }

     
    };

    // Listen for setActiveTab events
    const handleSetActiveTab = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.tab) {
        const newTab = event.detail.tab;
        console.log("Setting active tab to:", newTab);
        
        // Set the active tab state
        setActiveTab(event.detail.tab);
      }
    };

    window.addEventListener("setActiveTab", handleSetActiveTab);
    window.addEventListener("dashboardUpdate", handleUpdate);
    return () => {
      window.removeEventListener("dashboardUpdate", handleUpdate);
      window.removeEventListener("setActiveTab", handleSetActiveTab);
    };
  }, [refreshData, refreshStats]);

  // Handle closing the FP congrats modal
  const handleCloseModal = () => {
    setFpEarned(null);
    setFpCategory(null);
  };

  // Show loading state while data is being fetched
  if ((dashboardLoading || statsLoading) && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Ensure we have data before rendering
  if (!data) {
    return null;
  }

  return (
    <div className="relative">
      {fpEarned !== null && (
        <FPCongrats
          fpEarned={fpEarned}
          category={fpCategory}
          onClose={handleCloseModal}
        />
      )}

      {/* Subscription trial notification */}
      <SubscriptionNotification />

      {/* Inactivity Alert */}
      {showInactiveAlert && (
        <div className="fixed bottom-4 left-4 z-50 max-w-md bg-gray-800 rounded-lg shadow-lg border border-yellow-500/30 p-4 animate-[bounceIn_0.5s_ease-out]">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-full">
              <AlertTriangle className="text-yellow-500\" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-white font-semibold">
                  Fuel Points Needed!
                </h3>
                <button
                  onClick={() => setShowInactiveAlert(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                It's been {data?.days_since_fp} days since you earned Fuel
                Points. Complete a daily boost to maintain your progress!
              </p>
              <button
                onClick={() => {
                  setActiveTab("boosts");
                  // Delay scrolling to ensure tab change is processed first
                  setTimeout(() => {
                    scrollToSection("boosts");
                  }, 100);
                  setShowInactiveAlert(false);
                }}
                className="mt-2 px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Go to Boosts
              </button>
            </div>
          </div>
        </div>
      )}

      <CompanyLogo />
      <div>
        <DashboardHeader
          healthSpanYears={data.healthSpanYears}
          healthScore={data.healthScore}
          days_since_fp={data.days_since_fp}
          level={stats.level}
          nextLevelPoints={stats.nextLevelPoints}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-6">
        <div className="bg-gray-700/50 backdrop-blur-sm rounded-2xl p-4 my-6">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => {
                setActiveTab("standings");
                scrollToSection("leaderboard");
              }}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "standings" ||
                activeTab === "boosts" ||
                activeTab === "challenges"
                  ? "bg-orange-500/20 text-orange-500"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 hover:text-white"
              }`}
            >
              <Rocket
                size={28}
                className={
                  activeTab === "standings" ||
                  activeTab === "boosts" ||
                  activeTab === "challenges"
                    ? "text-orange-500"
                    : "text-gray-400"
                }
              />
              <div className="flex flex-col items-center">
                <span className="text-sm">HealthSpan Mission</span>
                <span className="text-[10px] text-gray-400">Single Player</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("contests")}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                activeTab === "contests"
                  ? "bg-orange-500/20 text-orange-500"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 hover:text-white"
              }`}
            >
              <Trophy
                size={28}
                className={
                  activeTab === "contests" ? "text-orange-500" : "text-gray-400"
                }
              />
              <div className="flex flex-col items-center">
                <span className="text-sm">Contest Arena</span>
                <span className="text-[10px] text-gray-400">Multi Player</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("cosmo")}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                activeTab === "cosmo"
                  ? "bg-orange-500/20 text-orange-500"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 hover:text-white"
              }`}
            >
              <Radio
                size={28}
                className={
                  activeTab === "cosmo" ? "text-orange-500" : "text-gray-400"
                }
              />
              <div className="flex flex-col items-center">
                <span className="text-sm">Cosmo AI Guide</span>
                <span className="text-[10px] text-gray-400">Player Agent</span>
              </div>
            </button>
          </div>
        </div>
        {/* Show TabNav only when in HealthSpan Mission */}
        {activeTab !== "contests" && activeTab !== "cosmo" ? (
          <>
            <h2 className="text-xl font-bold text-white">HealthSpan Mission</h2>

            <MyRocket
              level={stats.level}
              fuelPoints={stats.fuelPoints}
              nextLevelPoints={stats.nextLevelPoints}
              showLevelUpModal={showLevelUpModal}
              setShowLevelUpModal={setShowLevelUpModal}
            />

            <TabNav
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                // Scroll to appropriate section
                // Delay scrolling to ensure tab change is processed first
                setTimeout(() => {
                  if (tab === "standings") {
                    scrollToSection("leaderboard");
                  } else if (tab === "challenges") {
                    scrollToSection("challenges");
                  } else if (tab === "boosts") {
                    scrollToSection("boosts");
                  }
                }, 100);
              }}
            />

            {activeTab === "standings" && <RankStatus />}

            {activeTab === "boosts" && (
              <DailyBoosts
                burnStreak={burnStreak}
                completedBoosts={data.completedBoosts}
                selectedBoosts={selectedBoosts}
                weeklyBoosts={weeklyBoosts}
                daysUntilReset={daysUntilReset}
                todayStats={todayStats}
                onCompleteBoost={completeBoost}
              />
            )}

            {activeTab === "challenges" && (
              <>
                <ChallengeGrid
                  userId={user?.id}
                />

                <QuestCard
                  userId={user?.id}
                  categoryScores={data.categoryScores}
                />
              </>
            )}
          </>
        ) : activeTab === "contests" ? (
          <ContestsGrid
            userId={user?.id}
            categoryScores={data.categoryScores}
          />
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Cosmo AI Guide</h2>
            <Card className="p-4 mb-20">
              <div className="flex items-center gap-2 mb-6">
                <Radio className="text-orange-500" size={24} />
                <div>
                  <h3 className="text-lg font-medium text-white">
                    Your AI Health Agent
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Cosmo can help you learn about the game, understand your
                    health metrics, recommend guidance to support your personal
                    health mission, and more.
                  </p>
                </div>
              </div>
              <CosmoChat
                onClose={() => setActiveTab("standings")}
                setActiveTab={setActiveTab}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}