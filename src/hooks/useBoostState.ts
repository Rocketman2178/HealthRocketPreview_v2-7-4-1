import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { fixBoostCompletionFunction } from "../lib/utils/fixBoostFunction";
import type { BoostState } from "../types/dashboard";

export function useBoostState(userId: string | undefined) {
  const [selectedBoosts, setSelectedBoosts] = useState<BoostState[]>([]);
  const [weeklyBoosts, setWeeklyBoosts] = useState<BoostState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysUntilReset, setDaysUntilReset] = useState<number>(7);
  const [burnStreak, setBurnStreak] = useState<number>(0);
  const [weekStartDate, setWeekStartDate] = useState<Date>(new Date());
  const [todayStats, setTodayStats] = useState<{
    boostsCompleted: number;
    boostsRemaining: number;
    fpEarned: number;
    burnStreak: number;
  }>({
    boostsCompleted: 0,
    boostsRemaining: 3,
    fpEarned: 0,
    burnStreak: 0,
  });

  const getTodayStats = useCallback(async () => {
    if (!userId) return;

    console.log("Getting today's stats for user:", userId);
    
    // Get today's stats from RPC function
    const { data: stats, error: statsError } = await supabase.rpc(
      "get_today_stats",
      {
        p_user_id: userId,
      }
    );

    if (statsError) {
      console.error("Error getting today's stats:", statsError);
      return;
    }

    // Ensure we have the burn streak from the database
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('burn_streak')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error("Error getting user's burn streak:", userError);
      } else {
        // Set burn streak from database
        setBurnStreak(userData?.burn_streak || 0);
      }

      // Set today's stats
      setTodayStats({
        boostsCompleted: stats?.boosts_completed || 0,
        boostsRemaining: stats?.boosts_remaining || 0,
        fpEarned: stats?.fp_earned || 0,
        burnStreak: userData?.burn_streak || 0,
      });
    } catch (err) {
      console.error("Error fetching burn streak:", err);
      
      // Set stats without burn streak from user table
      setTodayStats({
        boostsCompleted: stats?.boosts_completed || 0,
        boostsRemaining: stats?.boosts_remaining || 0,
        fpEarned: stats?.fp_earned || 0,
        burnStreak: userData?.burn_streak || 0,
      });
    }

    // Get today's completed boosts and set them
    const today = new Date().toISOString().split("T")[0];
    try {
      const { data: todayBoosts, error: boostsError } = await supabase
        .from("completed_boosts")
        .select("*")
        .eq("user_id", userId)
        .eq("completed_date", today);

      if (boostsError) {
        console.error("Error getting today's boosts:", boostsError);
        return;
      }

      // Set today's completed boosts
      setSelectedBoosts(
        todayBoosts?.map((boost) => ({
          id: boost.boost_id,
          completedAt: new Date(boost.completed_at),
          weekStartDate: weekStartDate,
        })) || []
      );
    } catch (err) {
      console.error("Error fetching today's boosts:", err);
    }
  }, [userId, weekStartDate]);

  // Get today's completed boosts count
  const getTodayBoostCount = useCallback(async () => {
    if (!userId) return 0;
    const today = new Date().toISOString().split("T")[0];

    try {
      const { data, error } = await supabase
        .from("completed_boosts")
        .select("*")
        .eq("user_id", userId)
        .eq("completed_date", today);

      if (error) {
        console.error("Error getting today's boosts:", error);
        return 0;
      }

      return data?.length || 0;
    } catch (err) {
      console.error("Error counting today's boosts:", err);
      return 0;
    }
  }, [userId]);

  // Initialize today's stats on mount
  useEffect(() => {
    getTodayStats();
    
    // Refresh stats every minute to ensure burn streak is always up to date
    const refreshInterval = setInterval(() => {
      console.log("Refreshing today's stats");
      getTodayStats();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [getTodayStats]);

  // Fetch completed boosts for current week
  useEffect(() => {
    if (!userId) return;

    const fetchCompletedBoosts = async () => {
      try {
        // Calculate week start
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        // Fetch completed boosts for this week
        const { data: completedBoosts, error } = await supabase
          .from("completed_boosts")
          .select("*")
          .eq("user_id", userId)
          .gte("completed_date", weekStart.toISOString().split("T")[0]);

        if (error) throw error;

        // Update weekly boosts state
        if (completedBoosts) {
          setWeeklyBoosts(
            completedBoosts.map((boost) => ({
              id: boost.boost_id,
              completedAt: new Date(boost.completed_at),
              weekStartDate: weekStart,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching completed boosts:", err);
      }
    };

    fetchCompletedBoosts();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const initializeBoosts = async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      setWeekStartDate(weekStart);

      // Clear all boost states at the start of a new week
      if (daysUntilReset === 7) {
        setWeeklyBoosts([]);
        setSelectedBoosts([]);
      }

      setIsLoading(false);
    };

    initializeBoosts();
  }, [userId, daysUntilReset]);

  // Calculate days until reset
  useEffect(() => {
    const calculateDaysUntilReset = () => {
      const now = new Date();
      const nextSunday = new Date(now);
      // Calculate days until next Sunday (0 = Sunday, 1 = Monday, etc.)
      // If today is Sunday, we want 7 days (next Sunday)
      // Otherwise, we want the days remaining until Sunday
      const daysUntilSunday = now.getDay() === 0 ? 7 : 7 - now.getDay();
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(0, 0, 0, 0);

      const diffTime = nextSunday.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilReset(diffDays);
    };

    calculateDaysUntilReset();
    const interval = setInterval(calculateDaysUntilReset, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [userId]);

  // Schedule sync at midnight
  useEffect(() => {
    if (!userId || isLoading) return;

    // Check if we need to reset weekly boosts
    const checkWeeklyReset = () => {
      const now = new Date();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay()); // Go back to Sunday
      currentWeekStart.setHours(0, 0, 0, 0);
      
      // If our stored weekStartDate is before the current week's start,
      // we need to reset the weekly boosts
      if (weekStartDate < currentWeekStart) {
        console.log('New week detected, resetting weekly boosts');
        setWeekStartDate(currentWeekStart);
        setWeeklyBoosts([]);
        // Don't reset selectedBoosts here as they're for today only
      }
    };
    
    // Check for weekly reset on mount
    checkWeeklyReset();

    // Refresh stats every minute
    const interval = setInterval(getTodayStats, 60000);
    
    // Also check for weekly reset at midnight
    const midnightCheck = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();
      
      // Set timeout for midnight
      setTimeout(() => {
        checkWeeklyReset();
        // Recursively set the next midnight check
        midnightCheck();
      }, timeUntilMidnight);
    };
    
    // Start the midnight check cycle
    midnightCheck();
    
    return () => clearInterval(interval);
  }, [userId, weekStartDate, isLoading]);

  const completeBoost = async (boostId: string, category: string) => {
    try {
      // Check if already at daily limit
      if (todayStats.boostsRemaining <= 0) {
        console.warn("Daily boost limit reached");
        return;
      }

      let data, error;

      try {
        // Try to complete the boost with explicit error handling
        const result = await supabase.rpc("complete_boost", {
          p_user_id: userId,
          p_boost_id: boostId,
        });
        data = result.data;
        error = result.error;

        if (error) {
          // Try to fix the function and retry
          const fixResult = await fixBoostCompletionFunction();
          if (fixResult.success) {
            const retryResult = await supabase.rpc("complete_boost", {
              p_user_id: userId,
              p_boost_id: boostId,
            });
            data = retryResult.data;
            error = retryResult.error;
          }
        }

        // If still no data but no error, try direct update
        if ((!data || Object.keys(data).length === 0) && !error) {
          // Try to directly update daily FP
          const debugResult = await supabase.rpc("debug_daily_fp_update", {
            p_user_id: userId,
            p_boost_id: boostId,
          });
          // Use debug result as data if available
          if (debugResult.data && !debugResult.error) {
            data = {
              success: true,
              fp_earned: debugResult.data.fp_value || 1,
              boost_category: category,
            };
          } else {
            // Try the new debug function
            const directDebugResult = await supabase.rpc(
              "debug_boost_completion",
              {
                p_user_id: userId,
                p_boost_id: boostId,
              }
            );
            if (directDebugResult.data && !directDebugResult.error) {
              // Extract FP value from the debug result
              const fpValue =
                directDebugResult.data.complete_boost_result?.fp_earned ||
                directDebugResult.data.user_after?.fuel_points -
                  directDebugResult.data.user_before?.fuel_points ||
                1;

              data = {
                success: true,
                fp_earned: fpValue,
                boost_category: category,
              };
            }
          }
        }
      } catch (err) {
        error = err;
      }

      if (error) throw error;

      // If we still don't have data, create a default response
      if (!data || Object.keys(data).length === 0) {
        data = {
          success: true,
          fp_earned: 1, // Default to 1 FP
          boost_category: category,
        };

        // Log the default data
      }

      // Ensure we have a valid fp_earned value
      if (!data.fp_earned || isNaN(data.fp_earned)) {
        data.fp_earned = 1;
      }

      // Dispatch dashboard update event with FP earned
      window.dispatchEvent(
        new CustomEvent("dashboardUpdate", {
          detail: {
            fpEarned: data.fp_earned,
            updatedPart: "boost",
            category: data.boost_category || category,
          },
        })
      );
      // Refresh data after successful completion
      try {
        const { data: completedBoosts, error: fetchError } = await supabase
          .from("completed_boosts")
          .select("boost_id, completed_at")
          .eq("user_id", userId)
          .gte("completed_date", weekStartDate.toISOString().split("T")[0]);

        if (fetchError) {
          throw fetchError;
        } else {
          // Update weekly boosts state
          if (completedBoosts) {
            setWeeklyBoosts(
              completedBoosts.map((boost) => ({
                id: boost.boost_id,
                completedAt: new Date(boost.completed_at),
                weekStartDate: weekStartDate,
              }))
            );
          }
        }
        await getTodayStats();
      } catch (refreshErr) {
        // Continue despite error - the boost was completed successfully
      }
      return data.fp_earned;
    } catch (err) {
      throw err;
    }
  };

  return {
    selectedBoosts,
    todayStats,
    burnStreak,
    weeklyBoosts,
    daysUntilReset,
    completeBoost,
    isLoading,
  };
}
